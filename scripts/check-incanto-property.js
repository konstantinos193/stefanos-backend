const axios = require('axios');

async function updateIncantoProperty() {
  try {
    console.log('Updating Incanto Hotel to Incanto Apartments...');
    
    const API_URL = 'https://stefanos-backend.onrender.com/api';
    
    // First, get the current property to find its ID
    const getResponse = await axios.get(`${API_URL}/properties?limit=10&sortBy=createdAt&sortOrder=desc`);
    const incantoProperty = getResponse.data.data.properties.find(p => 
      p.titleEn.includes('Incanto') || p.titleGr.includes('Incanto')
    );
    
    if (!incantoProperty) {
      console.log('❌ No Incanto property found');
      return;
    }
    
    console.log(`Found Incanto property with ID: ${incantoProperty.id}`);
    
    // Update the property (this would need authentication in a real scenario)
    console.log('Note: This endpoint requires authentication. Manual update needed.');
    console.log('Current data:');
    console.log(`- Title EN: ${incantoProperty.titleEn}`);
    console.log(`- Title GR: ${incantoProperty.titleGr}`);
    console.log(`- Type: ${incantoProperty.type}`);
    console.log(`- Description EN: ${incantoProperty.descriptionEn}`);
    
    console.log('\n✅ Property found! Update needed to:');
    console.log('- Title EN: L\'Incanto Apartments');
    console.log('- Title GR: L\'Incanto Apartments');
    console.log('- Type: APARTMENT');
    console.log('- Description EN: Exclusive apartment complexes in Preveza with panoramic views of the Ionian Sea. Luxury accommodation with excellent amenities.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateIncantoProperty();
