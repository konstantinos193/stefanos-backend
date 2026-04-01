const API_BASE_URL = 'https://stefanos-backend.onrender.com';

async function testItalianAPI() {
  try {
    console.log('Testing API for Italian data...');
    
    // Get all rooms
    const response = await fetch(`${API_BASE_URL}/api/rooms/public/all`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rooms: ${response.status}`);
    }
    
    const rooms = await response.json();
    console.log(`Found ${rooms.length} rooms`);
    
    // Check first room for Italian data
    const firstRoom = rooms[0];
    console.log('\\nFirst room details:');
    console.log(`Name: ${firstRoom.name}`);
    console.log(`Name EN: ${firstRoom.nameEn}`);
    console.log(`Name IT: ${firstRoom.nameIt}`);
    console.log(`Description IT: ${firstRoom.descriptionIt?.substring(0, 100)}...`);
    
    // Check property for Italian data
    if (firstRoom.property) {
      console.log('\\nProperty details:');
      console.log(`Title EN: ${firstRoom.property.titleEn}`);
      console.log(`Title IT: ${firstRoom.property.titleIt}`);
      console.log(`Description IT: ${firstRoom.property.descriptionIt?.substring(0, 100)}...`);
    }
    
    // Check amenities for Italian data
    if (firstRoom.amenities && firstRoom.amenities.length > 0) {
      console.log('\\nFirst few amenities:');
      firstRoom.amenities.slice(0, 3).forEach((amenity, index) => {
        console.log(`${index + 1}. ${amenity.name || amenity.nameEn || amenity} -> ${amenity.nameIt || 'No IT'}`);
      });
    }
    
    console.log('\\n✅ API test completed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testItalianAPI();
