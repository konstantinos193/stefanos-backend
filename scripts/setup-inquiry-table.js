const { PrismaClient } = require('../prisma/generated/prisma');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

async function setupInquiryTable() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    const adapter = new PrismaLibSql({ url: databaseUrl });
    const prisma = new PrismaClient({ adapter });

    console.log('Connecting to database...');
    await prisma.$connect();

    console.log('Creating Inquiry table...');
    
    // Execute the CREATE TABLE statement first
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS inquiries (
          id TEXT PRIMARY KEY,
          propertyId TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'NEW',
          priority TEXT NOT NULL DEFAULT 'MEDIUM',
          respondedAt DATETIME,
          respondedBy TEXT,
          response TEXT,
          adminNotes TEXT,
          assignedTo TEXT,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
          FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
      )
    `;
    
    await prisma.$executeRawUnsafe(createTableSQL);
    console.log('Table created successfully!');

    // Now create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_inquiries_propertyId ON inquiries(propertyId)',
      'CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)',
      'CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority)',
      'CREATE INDEX IF NOT EXISTS idx_inquiries_assignedTo ON inquiries(assignedTo)',
      'CREATE INDEX IF NOT EXISTS idx_inquiries_createdAt ON inquiries(createdAt)'
    ];

    for (const indexSQL of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSQL);
        console.log('Index created:', indexSQL.substring(0, 50) + '...');
      } catch (error) {
        console.warn('Warning: Failed to create index:', error.message);
      }
    }

    console.log('Inquiry table setup completed successfully!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating Inquiry table:', error);
    process.exit(1);
  }
}

setupInquiryTable();
