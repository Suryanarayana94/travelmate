export const ROLES = [
  {
    value: 'traveller',
    label: 'Traveller',
    short: 'Plan trips',
    description: 'Estimate costs, save itineraries and book trusted local services.',
    icon: 'compass',
    color: 'mint'
  },
  {
    value: 'guide',
    label: 'Travel Guide',
    short: 'Lead experiences',
    description: 'Publish guided experiences, manage requests and grow your bookings.',
    icon: 'route',
    color: 'amber'
  },
  {
    value: 'transport',
    label: 'Transport Agency',
    short: 'Move travellers',
    description: 'List vehicles and routes with transparent, per-km pricing.',
    icon: 'car',
    color: 'blue'
  },
  {
    value: 'hotel',
    label: 'Hotel',
    short: 'Host guests',
    description: 'Showcase rooms and amenities, receive direct booking requests.',
    icon: 'bed',
    color: 'violet'
  }
];

export const ROLE_MAP = Object.fromEntries(ROLES.map((role) => [role.value, role]));
export const PROVIDER_ROLES = ['guide', 'transport', 'hotel'];

export const SERVICE_TYPES = [
  { value: 'guide', label: 'Travel guides', singular: 'Guide', icon: 'route' },
  { value: 'transport', label: 'Transport', singular: 'Transport', icon: 'car' },
  { value: 'hotel', label: 'Hotels & stays', singular: 'Stay', icon: 'bed' }
];

export const TRANSPORT_MODES = [
  { value: 'bus', label: 'AC bus', icon: 'bus', hint: 'Best value' },
  { value: 'train', label: 'Train (3AC)', icon: 'train', hint: 'Balanced' },
  { value: 'flight', label: 'Economy flight', icon: 'plane', hint: 'Fastest' },
  { value: 'cab', label: 'Private cab', icon: 'car', hint: 'Door-to-door' },
  { value: 'self', label: 'Self-drive', icon: 'fuel', hint: 'Fuel estimate' }
];

export const HOTEL_TIERS = [
  { value: 'budget', label: 'Budget', hint: 'Clean & simple' },
  { value: 'standard', label: 'Standard', hint: 'Most popular' },
  { value: 'premium', label: 'Premium', hint: 'Extra comfort' }
];

export const PRICE_UNITS = [
  { value: 'day', label: 'per day' },
  { value: 'trip', label: 'per trip' },
  { value: 'night', label: 'per night' },
  { value: 'km', label: 'per km' },
  { value: 'hour', label: 'per hour' }
];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
export const TRIP_STATUSES = ['planned', 'booked', 'completed', 'cancelled'];

export const DEMO_ACCOUNTS = [
  { role: 'traveller', email: 'traveller@travelmate.in', label: 'Traveller' },
  { role: 'guide', email: 'guide@travelmate.in', label: 'Travel guide' },
  { role: 'transport', email: 'transport@travelmate.in', label: 'Transport' },
  { role: 'hotel', email: 'hotel@travelmate.in', label: 'Hotel' }
];
export const DEMO_PASSWORD = 'Demo@123';
