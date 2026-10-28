const Destination = require('../models/Destination');
const User = require('../models/User');
const Service = require('../models/Service');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const destinationSeeds = require('../data/destinations');
const { estimateTrip } = require('./costService');

const DEMO_PASSWORD = 'Demo@123';

const demoUsers = [
  {
    email: 'traveller@travelmate.in',
    name: 'Aarav Traveller',
    role: 'traveller',
    phone: '+91 98765 43210',
    city: 'Hyderabad',
    state: 'Telangana',
    bio: 'Weekend explorer planning heritage trails, mountain escapes and coastal getaways across India.',
    profileImage: '/images/avatars/traveller.svg',
    languages: ['English', 'Hindi', 'Telugu'],
    specialities: [],
    serviceAreas: [],
    amenities: [],
    vehicleTypes: []
  },
  {
    email: 'guide@travelmate.in',
    name: 'Meera Guide',
    role: 'guide',
    phone: '+91 98200 11223',
    city: 'Panaji',
    state: 'Goa',
    bio: 'Government-trained local storyteller specialising in Goan heritage, food walks and hidden beaches.',
    profileImage: '/images/avatars/guide.svg',
    languages: ['English', 'Hindi', 'Konkani', 'Portuguese'],
    specialities: ['Heritage walks', 'Food trails', 'Beach hopping'],
    experienceYears: 8,
    dailyRate: 2200,
    serviceAreas: ['Goa', 'Karnataka coast'],
    verified: true
  },
  {
    email: 'transport@travelmate.in',
    name: 'RoadWing Travels',
    role: 'transport',
    phone: '+91 98230 44556',
    city: 'Pune',
    state: 'Maharashtra',
    bio: 'Verified intercity cab operator with sanitised vehicles, professional drivers and transparent per-km pricing.',
    profileImage: '/images/avatars/transport.svg',
    languages: ['English', 'Hindi', 'Marathi'],
    vehicleTypes: ['Sedan', 'SUV', 'Tempo Traveller'],
    serviceAreas: ['Maharashtra', 'Goa', 'Karnataka', 'Rajasthan', 'Himachal Pradesh'],
    experienceYears: 11,
    verified: true,
    website: 'https://example.com/roadwing'
  },
  {
    email: 'hotel@travelmate.in',
    name: 'PalmShade Stays',
    role: 'hotel',
    phone: '+91 98470 77889',
    city: 'Kochi',
    state: 'Kerala',
    bio: 'A small collection of locally owned beach stays, heritage havelis and lakeside homestays with warm hosts.',
    profileImage: '/images/avatars/hotel.svg',
    languages: ['English', 'Hindi', 'Malayalam'],
    amenities: ['Breakfast', 'Wi-Fi', 'Air conditioning', 'Airport pickup'],
    hotelCategory: 'standard',
    specialities: ['Boutique stays', 'Heritage properties'],
    serviceAreas: ['Goa', 'Kerala', 'Rajasthan'],
    experienceYears: 6,
    verified: true,
    website: 'https://example.com/palmshade'
  }
];

const serviceSeeds = (owners) => [
  {
    seedKey: 'demo-guide-goa',
    owner: owners.guide._id,
    type: 'guide',
    title: 'Goa heritage & hidden-beach guide',
    destinationSlug: 'goa',
    city: 'Panaji',
    description:
      'A friendly full-day guided experience covering Fort Aguada, local Goan lunch, Anjuna’s cliffs and a sunset at Chapora Fort. Itinerary adapts to your pace.',
    image: '/images/places/fort-aguada.jpg',
    price: { amount: 2200, unit: 'day' },
    capacity: 8,
    contactPhone: '+91 98200 11223',
    contactEmail: 'guide@travelmate.in',
    languages: ['English', 'Hindi', 'Konkani'],
    tags: ['Heritage', 'Food', 'Beaches'],
    rating: 4.9,
    reviews: 128,
    featured: true
  },
  {
    seedKey: 'demo-guide-jaipur',
    owner: owners.guide._id,
    type: 'guide',
    title: 'Jaipur royal trails storyteller',
    destinationSlug: 'jaipur',
    city: 'Jaipur',
    description:
      'Skip-the-line orientation, Amer Fort storytelling, Hawa Mahal photography stops and an old-city bazaar walk with a licensed local guide.',
    image: '/images/places/amber-fort.jpg',
    price: { amount: 1800, unit: 'day' },
    capacity: 10,
    languages: ['English', 'Hindi'],
    tags: ['Monuments', 'Photography', 'Bazaars'],
    rating: 4.8,
    reviews: 86,
    featured: true
  },
  {
    seedKey: 'demo-guide-kerala',
    owner: owners.guide._id,
    type: 'guide',
    title: 'Kerala backwater nature guide',
    destinationSlug: 'kerala',
    city: 'Alappuzha',
    description:
      'Guided village canals, birdwatching, spice-garden visits and responsible houseboat recommendations around the Kerala backwaters.',
    image: '/images/places/alleppey-backwaters.jpg',
    price: { amount: 2400, unit: 'day' },
    capacity: 6,
    languages: ['English', 'Malayalam', 'Hindi'],
    tags: ['Nature', 'Birdwatching', 'Village life'],
    rating: 4.9,
    reviews: 72
  },
  {
    seedKey: 'demo-transport-goa',
    owner: owners.transport._id,
    type: 'transport',
    title: 'Goa airport transfer & coastal cab',
    destinationSlug: 'goa',
    city: 'Panaji',
    description:
      'Clean AC sedan or SUV with an experienced driver for airport pickup, intercity transfers and full-day North or South Goa sightseeing.',
    image: '/images/places/baga-beach.jpg',
    price: { amount: 18, unit: 'km' },
    capacity: 6,
    contactPhone: '+91 98230 44556',
    contactEmail: 'transport@travelmate.in',
    languages: ['English', 'Hindi', 'Marathi'],
    tags: ['Airport transfer', 'AC cab', 'SUV available'],
    rating: 4.7,
    reviews: 214,
    featured: true
  },
  {
    seedKey: 'demo-transport-agra',
    owner: owners.transport._id,
    type: 'transport',
    title: 'Delhi–Agra–Jaipur private car',
    destinationSlug: 'agra',
    city: 'Agra',
    description:
      'Flexible Golden Triangle road trip with a courteous driver, fuel-inclusive per-km rate and optional same-day return to Delhi.',
    image: '/images/places/taj-mahal.jpg',
    price: { amount: 16, unit: 'km' },
    capacity: 6,
    tags: ['Intercity', 'Golden Triangle', 'Flexible itinerary'],
    rating: 4.6,
    reviews: 143
  },
  {
    seedKey: 'demo-transport-manali',
    owner: owners.transport._id,
    type: 'transport',
    title: 'Manali mountain routes & snow points',
    destinationSlug: 'manali',
    city: 'Manali',
    description:
      'Mountain-experienced drivers for Solang Valley, Rohtang Pass permit assistance, airport transfers and safe winter road travel.',
    image: '/images/places/solang-valley.jpg',
    price: { amount: 19, unit: 'km' },
    capacity: 6,
    tags: ['Mountain driver', 'Solang Valley', 'Winter travel'],
    rating: 4.8,
    reviews: 97,
    featured: true
  },
  {
    seedKey: 'demo-hotel-goa',
    owner: owners.hotel._id,
    type: 'hotel',
    title: 'PalmShade boutique beach stay, Goa',
    destinationSlug: 'goa',
    city: 'Anjuna',
    description:
      'Bright rooms five minutes from Anjuna Beach, with breakfast, a palm courtyard, fast Wi-Fi and help arranging scooters and water sports.',
    image: '/images/places/anjuna-beach.jpg',
    price: { amount: 4200, unit: 'night' },
    capacity: 3,
    contactPhone: '+91 98470 77889',
    contactEmail: 'hotel@travelmate.in',
    languages: ['English', 'Hindi', 'Konkani'],
    tags: ['Breakfast', 'Near beach', 'Wi-Fi'],
    rating: 4.7,
    reviews: 189,
    featured: true
  },
  {
    seedKey: 'demo-hotel-jaipur',
    owner: owners.hotel._id,
    type: 'hotel',
    title: 'Heritage haveli room in Pink City',
    destinationSlug: 'jaipur',
    city: 'Jaipur',
    description:
      'Restored courtyard room in a family-run haveli close to City Palace, with rooftop breakfast views and curated local food recommendations.',
    image: '/images/places/city-palace-jaipur.jpg',
    price: { amount: 3600, unit: 'night' },
    capacity: 3,
    tags: ['Heritage', 'Rooftop breakfast', 'Central location'],
    rating: 4.8,
    reviews: 121
  },
  {
    seedKey: 'demo-hotel-kerala',
    owner: owners.hotel._id,
    type: 'hotel',
    title: 'Kerala lakeside homestay',
    destinationSlug: 'kerala',
    city: 'Alappuzha',
    description:
      'A peaceful family homestay beside the backwaters with home-cooked Kerala meals, canoe rides and responsible houseboat partnerships.',
    image: '/images/places/periyar-national-park.jpg',
    price: { amount: 2800, unit: 'night' },
    capacity: 4,
    tags: ['Homestay', 'Home-cooked food', 'Backwaters'],
    rating: 4.9,
    reviews: 158,
    featured: true
  }
];

async function seedDestinations() {
  const operations = destinationSeeds.map((destination) =>
    Destination.updateOne(
      { slug: destination.slug },
      { $set: { ...destination, active: true } },
      { upsert: true, runValidators: true }
    )
  );
  await Promise.all(operations);
  return Destination.countDocuments({ active: true });
}

async function ensureDemoUser(spec) {
  let user = await User.findOne({ email: spec.email });
  if (!user) {
    user = new User({ ...spec, passwordHash: DEMO_PASSWORD, verified: spec.verified ?? false });
    await user.save();
  }
  return user;
}

async function seedDemoData() {
  const [traveller, guide, transport, hotel] = await Promise.all(
    demoUsers.map((spec) => ensureDemoUser(spec))
  );
  const owners = { guide, transport, hotel };

  await Promise.all(
    serviceSeeds(owners).map((service) =>
      Service.updateOne(
        { seedKey: service.seedKey },
        { $setOnInsert: service },
        { upsert: true }
      )
    )
  );

  const goa = await Destination.findOne({ slug: 'goa' });
  const plannedEstimate = await estimateTrip(goa, {
    boardingPoint: 'Hyderabad',
    destinationSlug: 'goa',
    days: 4,
    travelers: 2,
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    options: {
      needTransport: true,
      transportMode: 'train',
      needHotel: true,
      hotelTier: 'standard',
      rooms: 1,
      needGuide: true,
      guideDays: 2,
      mealPlan: true,
      includeActivities: true
    }
  });

  const tripSeed = {
    seedKey: 'demo-trip-goa-hyderabad',
    owner: traveller._id,
    boardingPoint: plannedEstimate.boardingPoint,
    destinationSlug: 'goa',
    destinationName: 'Goa',
    startDate: new Date(plannedEstimate.options.startDate),
    days: plannedEstimate.options.days,
    travelers: plannedEstimate.options.travelers,
    options: plannedEstimate.options,
    estimate: plannedEstimate.estimate,
    notes: 'Anniversary trip — shortlist a beach stay and a heritage guide.',
    status: 'planned'
  };
  await Trip.updateOne(
    { seedKey: tripSeed.seedKey },
    { $setOnInsert: tripSeed },
    { upsert: true }
  );

  const trip = await Trip.findOne({ seedKey: tripSeed.seedKey });
  const guideService = await Service.findOne({ seedKey: 'demo-guide-goa' });
  const hotelService = await Service.findOne({ seedKey: 'demo-hotel-goa' });

  const bookingSeeds = [
    {
      seedKey: 'demo-booking-guide',
      traveller: traveller._id,
      provider: guide._id,
      service: guideService._id,
      serviceTitle: guideService.title,
      serviceType: 'guide',
      destinationSlug: 'goa',
      trip: trip._id,
      bookingDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      duration: 2,
      guests: 2,
      amount: 4400,
      note: 'Please include Fort Aguada and Chapora Fort at sunset.',
      contactPhone: traveller.phone,
      status: 'pending'
    },
    {
      seedKey: 'demo-booking-hotel',
      traveller: traveller._id,
      provider: hotel._id,
      service: hotelService._id,
      serviceTitle: hotelService.title,
      serviceType: 'hotel',
      destinationSlug: 'goa',
      trip: trip._id,
      bookingDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      duration: 3,
      guests: 2,
      amount: 12600,
      note: 'A quiet room with breakfast, preferably on an upper floor.',
      contactPhone: traveller.phone,
      status: 'confirmed'
    }
  ];

  await Promise.all(
    bookingSeeds.map((booking) =>
      Booking.updateOne({ seedKey: booking.seedKey }, { $setOnInsert: booking }, { upsert: true })
    )
  );

  return {
    users: 4,
    services: await Service.countDocuments({ owner: { $in: [guide._id, transport._id, hotel._id] } }),
    trips: await Trip.countDocuments({ owner: traveller._id }),
    bookings: await Booking.countDocuments({ traveller: traveller._id })
  };
}

async function seedAll({ demo = false } = {}) {
  const destinations = await seedDestinations();
  const demoData = demo ? await seedDemoData() : null;
  return { destinations, demoData };
}

module.exports = { seedDestinations, seedDemoData, seedAll, DEMO_PASSWORD, demoUsers };
