import { districts_en, upazilas_en, unions_en } from 'bangladesh-location-data';

export const dynamic = 'force-static';

export async function GET(request) {
  const locationData = {};
  
  // Iterate through all districts
  Object.values(districts_en).forEach((districts) => {
    if (!Array.isArray(districts)) return;
    
    districts.forEach((district) => {
      const cityName = district.title;
      const districtId = district.value;
      
      // Get all upazilas (zones) for this district
      const upazilas = upazilas_en[districtId] || [];
      const zones = {};
      
      upazilas.forEach((upazila) => {
        const zoneName = upazila.title;
        const upazilaId = upazila.value;
        
        // Get all unions (areas) for this upazila
        const unions = unions_en[upazilaId] || [];
        const areas = unions.map(union => union.title);
        
        zones[zoneName] = areas;
      });
      
      locationData[cityName] = { zones };
    });
  });

  return new Response(JSON.stringify({ locationData }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
