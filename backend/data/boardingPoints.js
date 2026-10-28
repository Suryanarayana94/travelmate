// Curated coordinates keep the estimate fast and available without a live geocoder.
// Unknown city names can optionally be resolved through OpenStreetMap Nominatim.
const boardingPoints = [
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, aliases: ['amdavad'] },
  { name: 'Amritsar', state: 'Punjab', lat: 31.5497, lng: 74.3435, aliases: [] },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, aliases: ['bangalore'] },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, aliases: [] },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, aliases: [] },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, aliases: [] },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, aliases: ['madras'] },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, aliases: [] },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, aliases: [] },
  { name: 'Delhi', state: 'NCT of Delhi', lat: 28.6139, lng: 77.209, aliases: ['new delhi'] },
  { name: 'Goa (Panaji)', state: 'Goa', lat: 15.4909, lng: 73.8278, aliases: ['panaji', 'panjim', 'goa'] },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, aliases: [] },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, aliases: ['secunderabad'] },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, aliases: [] },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, aliases: [] },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, aliases: ['cochin', 'ernakulam'] },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, aliases: ['calcutta'] },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, aliases: [] },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, aliases: ['bombay'] },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, aliases: [] },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, aliases: [] },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, aliases: ['poona'] },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, aliases: [] },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, aliases: [] },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, aliases: [] },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, aliases: ['trivandrum'] },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, aliases: ['benares', 'banaras'] },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, aliases: ['vizag'] }
];

module.exports = boardingPoints;
