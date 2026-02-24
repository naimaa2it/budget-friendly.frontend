// Bangladesh location data for checkout form
export const locationData = {
  Dhaka: {
    zones: {
      'Dhaka North': ['Banani', 'Gulshan', 'Baridhara', 'Mirpur', 'Uttara', 'Mohakhali', 'Tejgaon'],
      'Dhaka South': ['Dhanmondi', 'Motijheel', 'Ramna', 'Jatrabari', 'Khilgaon', 'Shahbag', 'Paltan'],
      'Dhaka East': ['Rampura', 'Badda', 'Moghbazar', 'Malibagh', 'Shantinagar', 'Eskaton'],
      'Dhaka West': ['Mohammadpur', 'Shyamoli', 'Adabor', 'Hazaribagh', 'Lalmatia'],
    },
  },
  Chittagong: {
    zones: {
      'Chittagong City': ['Agrabad', 'Panchlaish', 'Khulshi', 'Halishahar', 'Chawkbazar', 'Kotwali'],
      'Chittagong Port': ['Sadarghat', 'Bandar', 'Patenga', 'Chaktai'],
    },
  },
  Sylhet: {
    zones: {
      'Sylhet City': ['Zindabazar', 'Ambarkhana', 'Shahjalal Upashahar', 'Dargah Gate', 'Mendibagh'],
      'Sylhet Cantonment': ['Jalalabad', 'Tilagarh'],
    },
  },
  Rajshahi: {
    zones: {
      'Rajshahi City': ['Boalia', 'Shah Makhdum', 'Motihar', 'Rajpara', 'Katakhali'],
    },
  },
  Khulna: {
    zones: {
      'Khulna City': ['Sonadanga', 'Khulna Sadar', 'Daulatpur', 'Khalishpur'],
    },
  },
  Barishal: {
    zones: {
      'Barishal City': ['Barishal Sadar', 'Kawnia', 'Rupatoli', 'Notullabad'],
    },
  },
  Rangpur: {
    zones: {
      'Rangpur City': ['Rangpur Sadar', 'Haragach', 'Modern', 'Satmatha'],
    },
  },
  Mymensingh: {
    zones: {
      'Mymensingh City': ['Mymensingh Sadar', 'Charpara', 'Maskanda', 'Kachijhuli'],
    },
  },
};

// Get all cities
export const getCities = () => Object.keys(locationData);

// Get zones for a city
export const getZones = (city) => {
  if (!city || !locationData[city]) return [];
  return Object.keys(locationData[city].zones);
};

// Get areas for a zone
export const getAreas = (city, zone) => {
  if (!city || !zone || !locationData[city] || !locationData[city].zones[zone]) return [];
  return locationData[city].zones[zone];
};
