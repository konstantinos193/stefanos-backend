const API_BASE_URL = 'https://stefanos-backend.onrender.com';

// Italian translations for rooms
const italianRoomTranslations = {
  'Apartment 01 – Ground Level': 'Appartamento 01 – Piano Terra',
  'Apartment 02 – Ground Level': 'Appartamento 02 – Piano Terra',
  'Apartment 03 – First Floor': 'Appartamento 03 – Primo Piano',
  'Apartment 04 – First Floor': 'Appartamento 04 – Primo Piano',
  'Apartment 05 – First Floor': 'Appartamento 05 – Primo Piano',
  'Apartment 06 – Second Floor': 'Appartamento 06 – Secondo Piano',
  'Apartment 07 – Second Floor': 'Appartamento 07 – Secondo Piano',
  'Apartment 08 – Second Floor': 'Appartamento 08 – Secondo Piano',
  'Apartment 09 – Third Floor': 'Appartamento 09 – Terzo Piano',
  'Apartment 10 – Third Floor': 'Appartamento 10 – Terzo Piano',
};

// Italian descriptions for rooms
const italianRoomDescriptions = {
  'Apartment 01 – Ground Level': 'Un appartamento al piano terra raffinato e progettato per il comfort e l\'eleganza senza sforzo. Caratterizzato da un layout spazioso, arredi moderni e accesso diretto, questa residenza offre un\'atmosfera calma e privata ideale per il relax. Stilizzato con attenzione con dettagli premium, combina funzionalità con lusso discreto per un soggiorno veramente confortevole.',
  'Apartment 02 – Ground Level': 'Un appartamento al piano terra raffinato e progettato per il comfort e l\'eleganza senza sforzo. Caratterizzato da un layout spazioso, arredi moderni e accesso diretto, questa residenza offre un\'atmosfera calma e privata ideale per il relax. Stilizzato con attenzione con dettagli premium, combina funzionalità con lusso discreto per un soggiorno veramente confortevole.',
  'Apartment 03 – First Floor': 'Un elegante appartamento al primo piano che offre viste panoramiche e un design moderno. Spazioso e luminoso, questo appartamento combina comfort contemporaneo con stile classico per un\'esperienza di soggiorno indimenticabile.',
  'Apartment 04 – First Floor': 'Un elegante appartamento al primo piano che offre viste panoramiche e un design moderno. Spazioso e luminoso, questo appartamento combina comfort contemporaneo con stile classico per un\'esperienza di soggiorno indimenticabile.',
  'Apartment 05 – First Floor': 'Un elegante appartamento al primo piano che offre viste panoramiche e un design moderno. Spazioso e luminoso, questo appartamento combina comfort contemporaneo con stile classico per un\'esperienza di soggiorno indimenticabile.',
  'Apartment 06 – Second Floor': 'Un sofisticato appartamento al secondo piano con viste mozzafiato. Questo spazio ben progettato offre il perfetto equilibrio tra lusso e funzionalità, ideale per viaggiatori esigenti.',
  'Apartment 07 – Second Floor': 'Un sofisticato appartamento al secondo piano con viste mozzafiato. Questo spazio ben progettato offre il perfetto equilibrio tra lusso e funzionalità, ideale per viaggiatori esigenti.',
  'Apartment 08 – Second Floor': 'Un sofisticato appartamento al secondo piano con viste mozzafiato. Questo spazio ben progettato offre il perfetto equilibrio tra lusso e funzionalità, ideale per viaggiatori esigenti.',
  'Apartment 09 – Third Floor': 'Un lussuoso appartamento al terzo piano con viste spettacolari sul mare. Questo appartamento offre un\'esperienza di soggiorno premium con finiture di alta gamma e comfort moderni.',
  'Apartment 10 – Third Floor': 'Un lussuoso appartamento al terzo piano con viste spettacolari sul mare. Questo appartamento offre un\'esperienza di soggiorno premium con finiture di alta gamma e comfort moderni.',
};

async function updateItalianTranslations() {
  try {
    console.log('Fetching all rooms...');
    
    // Get all rooms
    const response = await fetch(`${API_BASE_URL}/api/rooms/public/all`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rooms: ${response.status}`);
    }
    
    const rooms = await response.json();
    console.log(`Found ${rooms.length} rooms`);
    
    // Note: This would require admin authentication to actually update
    // For now, this shows what needs to be updated
    console.log('\\nRooms that need Italian translations:');
    
    for (const room of rooms) {
      const roomName = room.nameEn || room.name;
      const italianName = italianRoomTranslations[roomName];
      const italianDescription = italianRoomDescriptions[roomName];
      
      console.log(`\\nRoom: ${roomName}`);
      console.log(`Italian Name: ${italianName}`);
      console.log(`Italian Description: ${italianDescription?.substring(0, 100)}...`);
      
      // This would be the actual update call (requires auth):
      /*
      const updateResponse = await fetch(`${API_BASE_URL}/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
        },
        body: JSON.stringify({
          nameIt: italianName,
          descriptionIt: italianDescription
        })
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Updated room: ${roomName}`);
      } else {
        console.log(`❌ Failed to update room: ${roomName}`);
      }
      */
    }
    
    console.log('\\n⚠️  Note: Actual updates require admin authentication');
    console.log('The database schema needs to be updated first to include Italian fields');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateItalianTranslations();
