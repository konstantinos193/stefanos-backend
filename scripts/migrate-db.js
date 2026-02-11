#!/usr/bin/env node

/**
 * Migrate the remote Turso database to match the Prisma schema.
 *
 * Strategy:
 *  1. Generate the full "from-empty" SQL from the Prisma schema (CREATE TABLE statements).
 *  2. Query the remote database for existing tables and their columns.
 *  3. Parse the expected columns from the CREATE TABLE statements.
 *  4. Emit ALTER TABLE ADD COLUMN for every missing column.
 *  5. Emit CREATE TABLE for entirely missing tables.
 *  6. Emit CREATE INDEX for missing indexes.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createClient } = require('libsql-client');
const dotenv = require('dotenv');

dotenv.config();

function splitSqlStatements(sqlText) {
  const withoutLineComments = sqlText
    .split(/\r?\n/)
    .map((line) => (line.trimStart().startsWith('--') ? '' : line))
    .join('\n');

  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < withoutLineComments.length; i += 1) {
    const char = withoutLineComments[i];

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }

  return statements;
}

/**
 * Parse column definitions from a CREATE TABLE statement.
 * Returns an array of { name, definition } objects.
 */
function parseCreateTableColumns(createSql) {
  // Extract table name
  const tableMatch = createSql.match(/CREATE\s+TABLE\s+"?(\w+)"?\s*\(/i);
  if (!tableMatch) return null;
  const tableName = tableMatch[1];

  // Extract the part inside the outermost parentheses
  const openParen = createSql.indexOf('(');
  const closeParen = createSql.lastIndexOf(')');
  if (openParen === -1 || closeParen === -1) return null;

  const inner = createSql.substring(openParen + 1, closeParen);

  // Split by commas, but respect parentheses nesting
  const parts = [];
  let depth = 0;
  let currentPart = '';
  for (const char of inner) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  if (currentPart.trim()) parts.push(currentPart.trim());

  const columns = [];
  for (const part of parts) {
    // Skip constraints (CONSTRAINT, PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK)
    const upper = part.toUpperCase().trimStart();
    if (
      upper.startsWith('CONSTRAINT') ||
      upper.startsWith('PRIMARY KEY') ||
      upper.startsWith('UNIQUE') ||
      upper.startsWith('FOREIGN KEY') ||
      upper.startsWith('CHECK')
    ) {
      continue;
    }

    // Column definition: "columnName" TYPE ...
    const colMatch = part.match(/^\s*"?(\w+)"?\s+(.+)$/s);
    if (colMatch) {
      columns.push({ name: colMatch[1], definition: part.trim() });
    }
  }

  return { tableName, columns };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in .env');
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stefanos-db-migrate-'));
  const tempSqlPath = path.join(tempRoot, 'init.sql');
  const tempSchemaDbPath = path.join(tempRoot, 'schema.sqlite');

  try {
    // Step 1: Generate full schema SQL from Prisma
    console.log('Generating full schema SQL from Prisma...');
    const prismaCliPath = require.resolve('prisma/build/index.js');

    execFileSync(
      process.execPath,
      [
        prismaCliPath,
        'migrate',
        'diff',
        '--from-empty',
        '--to-schema',
        'prisma/schema.prisma',
        '--script',
        '--output',
        tempSqlPath,
      ],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: `file:${tempSchemaDbPath}`,
        },
      },
    );

    const sqlText = fs.readFileSync(tempSqlPath, 'utf8');
    const allStatements = splitSqlStatements(sqlText);

    // Step 2: Query remote database for existing tables and columns
    console.log('Fetching current schema from remote database...');
    const client = createClient({ url: databaseUrl });

    const tablesResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'",
    );
    const existingTables = new Set(tablesResult.rows.map((r) => String(r.name)));

    // Get columns for each existing table
    const existingColumns = {};
    for (const tableName of existingTables) {
      const colResult = await client.execute(`PRAGMA table_info("${tableName}")`);
      existingColumns[tableName] = new Set(colResult.rows.map((r) => String(r.name)));
    }

    // Get existing indexes
    const indexResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'",
    );
    const existingIndexes = new Set(indexResult.rows.map((r) => String(r.name)));

    // Step 3: Compute migration statements
    const migrationStatements = [];

    for (const stmt of allStatements) {
      const upper = stmt.toUpperCase().trimStart();

      if (upper.startsWith('CREATE TABLE')) {
        const parsed = parseCreateTableColumns(stmt);
        if (!parsed) continue;

        if (!existingTables.has(parsed.tableName)) {
          // Entire table is missing — create it
          migrationStatements.push(stmt);
          console.log(`  + CREATE TABLE "${parsed.tableName}"`);
        } else {
          // Table exists — check for missing columns
          const existingCols = existingColumns[parsed.tableName] || new Set();
          for (const col of parsed.columns) {
            if (!existingCols.has(col.name)) {
              const alterStmt = `ALTER TABLE "${parsed.tableName}" ADD COLUMN ${col.definition}`;
              migrationStatements.push(alterStmt);
              console.log(`  + ALTER TABLE "${parsed.tableName}" ADD COLUMN "${col.name}"`);
            }
          }
        }
      } else if (upper.startsWith('CREATE UNIQUE INDEX') || upper.startsWith('CREATE INDEX')) {
        // Extract index name
        const idxMatch = stmt.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+"?(\w+)"?/i);
        if (idxMatch && !existingIndexes.has(idxMatch[1])) {
          migrationStatements.push(stmt);
          console.log(`  + CREATE INDEX "${idxMatch[1]}"`);
        }
      }
    }

    if (migrationStatements.length === 0) {
      console.log('\nNo schema differences found. Database is up to date.');
      await client.close();
      return;
    }

    console.log(`\nApplying ${migrationStatements.length} migration statements...`);

    for (let i = 0; i < migrationStatements.length; i += 1) {
      const statement = migrationStatements[i];
      try {
        await client.execute(statement);
        console.log(`  OK  [${i + 1}/${migrationStatements.length}] ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      } catch (error) {
        const message = String(error && error.message ? error.message : error);
        if (message.includes('already exists') || message.includes('duplicate column')) {
          console.log(`  SKIP [${i + 1}/${migrationStatements.length}] already exists`);
          continue;
        }
        throw new Error(
          `Failed at statement ${i + 1}/${migrationStatements.length}: ${message}\n  SQL: ${statement}`,
        );
      }
    }

    await client.close();
    console.log('\nMigration completed successfully.');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Migration failed:');
  console.error(error.message || error);
  process.exit(1);
});
