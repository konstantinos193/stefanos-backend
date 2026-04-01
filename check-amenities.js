const { createClient } = require('libsql-client');
require('dotenv').config();

const client = createClient({ url: process.env.DATABASE_URL });

async function checkAmenities() {
  try {
    const result = await client.execute('SELECT id, nameEn, nameIt FROM amenities');
    console.log('Amenities in database:');
    result.rows.forEach(row => {
      console.log(`${row.nameEn} -> ${row.nameIt || 'NO IT'}`);
    });
    client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAmenities();
