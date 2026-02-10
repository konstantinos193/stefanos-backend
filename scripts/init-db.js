#!/usr/bin/env node

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

function runSchemaDiff(outputSqlPath, tempSchemaDbPath) {
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
      outputSqlPath,
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
}

async function applyStatements(client, statements) {
  for (let i = 0; i < statements.length; i += 1) {
    const statement = statements[i];
    try {
      await client.execute(statement);
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      if (message.includes('already exists')) {
        continue;
      }

      throw new Error(
        `Failed while applying statement ${i + 1}/${statements.length}: ${message}`,
      );
    }
  }
}

async function hasTable(client, tableName) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [tableName],
  });

  return result.rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in .env');
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stefanos-db-init-'));
  const tempSchemaDbPath = path.join(tempRoot, 'schema.sqlite');
  const tempSqlPath = path.join(tempRoot, 'init.sql');

  try {
    console.log('Generating SQL diff from Prisma schema...');
    runSchemaDiff(tempSqlPath, tempSchemaDbPath);

    const sqlText = fs.readFileSync(tempSqlPath, 'utf8');
    const statements = splitSqlStatements(sqlText);

    if (statements.length === 0) {
      throw new Error('Generated SQL is empty, aborting');
    }

    console.log(`Applying ${statements.length} statements to database...`);
    const client = createClient({ url: databaseUrl });
    try {
      await applyStatements(client, statements);
      const roomsTableExists = await hasTable(client, 'rooms');
      if (!roomsTableExists) {
        throw new Error('Schema applied but "rooms" table is still missing');
      }
    } finally {
      await client.close();
    }

    console.log('Database schema initialized successfully.');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Database initialization failed:');
  console.error(error.message || error);
  process.exit(1);
});
