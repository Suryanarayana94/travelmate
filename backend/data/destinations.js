// Curated planning data. Prices are indicative INR estimates, not live tariffs.
// All landmark image paths resolve to files in frontend/public/images/places.
const destinations = [
  {
    slug: 'goa',
    name: 'Goa',
    state: 'Goa',
    region: 'West Coast',
    tagline: 'Golden beaches, Portuguese forts and easy-going coastal days.',
    description:
      'Goa blends Arabian Sea beaches with centuries-old churches, spice-scented hinterland and colourful markets. It is ideal for a relaxed beach holiday, a heritage walk through Old Goa, or a guided north-to-south coastal road trip.',
    heroImage: '/images/places/baga-beach.jpg',
    heroAlt: 'Sunset over Baga Beach in Goa',
    imageCredit: 'Wikimedia Commons',
    coordinates: { lat: 15.2993, lng: 74.124 },
    bestTime: 'November – February',
    idealDays: 4,
    fromPrice: 8999,
    rating: 4.8,
    tags: ['Beaches', 'Heritage', 'Nightlife', 'Water sports'],
    languages: ['Konkani', 'English', 'Hindi'],
    weather: 'Warm and tropical; monsoon is wettest from June to September.',
    safetyTip: 'Use licensed water-sports operators and avoid swimming after sunset.',
    dailyCosts: {
      budgetHotel: 2200,
      standardHotel: 4500,
      premiumHotel: 9500,
      food: 1000,
      localTransport: 800,
      activities: 900,
      guide: 1800
    },
    places: [
      {
        id: 'fort-aguada',
        name: 'Fort Aguada',
        category: 'Heritage',
        image: '/images/places/fort-aguada.jpg',
        description:
          'A 17th-century Portuguese fort and lighthouse overlooking the Arabian Sea at Sinquerim. Come for sweeping coastal views and stay for one of Goa’s best sunsets.',
        duration: '1–2 hours',
        entryFee: 0,
        highlight: 'Sunset viewpoint and historic lighthouse',
        bestTime: 'Late afternoon'
      },
      {
        id: 'baga-beach',
        name: 'Baga Beach',
        category: 'Beach',
        image: '/images/places/baga-beach.jpg',
        description:
          'North Goa’s energetic shoreline is known for water sports, beach shacks and a lively evening scene. It is a convenient base for Calangute and Anjuna.',
        duration: '2–4 hours',
        entryFee: 0,
        highlight: 'Parasailing and beachfront dining',
        bestTime: 'Morning or sunset'
      },
      {
        id: 'anjuna-beach',
        name: 'Anjuna Beach',
        category: 'Beach',
        image: '/images/places/anjuna-beach.jpg',
        description:
          'A rocky-and-sandy cove with palm-backed shacks, flea-market culture and a bohemian history. Great for a slower, more alternative Goa experience.',
        duration: '2–3 hours',
        entryFee: 0,
        highlight: 'Cliffside cafés and Wednesday flea market',
        bestTime: 'Sunset'
      },
      {
        id: 'chapora-fort',
        name: 'Chapora Fort',
        category: 'Heritage',
        image: '/images/places/chapora-fort.jpg',
        description:
          'Red-laterite ramparts above the Chapora River, made famous by panoramic views over Vagator and Anjuna. The short climb is especially rewarding at golden hour.',
        duration: '1 hour',
        entryFee: 0,
        highlight: 'Panoramic views of North Goa’s coastline',
        bestTime: 'Sunset'
      }
    ]
  },
  {
    slug: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    region: 'North India',
    tagline: 'Royal forts, pink façades, bazaars and desert colours.',
    description:
      'The Pink City is a living museum of Rajput architecture, craft traditions and food. Combine the hilltop grandeur of Amer with the geometric streets and bustling bazaars of the old city.',
    heroImage: '/images/places/amber-fort.jpg',
    heroAlt: 'Amer Fort reflected in Maota Lake, Jaipur',
    imageCredit: 'Wikimedia Commons',
    coordinates: { lat: 26.9124, lng: 75.7873 },
    bestTime: 'October – March',
    idealDays: 3,
    fromPrice: 6999,
    rating: 4.7,
    tags: ['Heritage', 'Architecture', 'Shopping', 'Food'],
    languages: ['Hindi', 'Rajasthani', 'English'],
    weather: 'Hot summers, mild winters and a monsoon from July to September.',
    safetyTip: 'Use official guides at monuments and agree on auto-rickshaw fares in advance.',
    dailyCosts: {
      budgetHotel: 1800,
      standardHotel: 3600,
      premiumHotel: 8000,
      food: 800,
      localTransport: 700,
      activities: 700,
      guide: 1500
    },
    places: [
      {
        id: 'amber-fort',
        name: 'Amer Fort',
        category: 'Heritage',
        image: '/images/places/amber-fort.jpg',
        description:
          'A vast hilltop fort-palace of honey-coloured sandstone and marble, with courtyards, mirror-work interiors and lake views about 11 km from Jaipur.',
        duration: '2–3 hours',
        entryFee: 100,
        highlight: 'Sheesh Mahal and the ramparts above Maota Lake',
        bestTime: 'Morning'
      },
      {
        id: 'hawa-mahal',
        name: 'Hawa Mahal',
        category: 'Architecture',
        image: '/images/places/hawa-mahal.jpg',
        description:
          'The iconic “Palace of Winds” has a honeycomb façade of 953 windows, designed so royal women could observe street life without being seen.',
        duration: '45–60 minutes',
        entryFee: 50,
        highlight: 'Five-storey pink sandstone façade',
        bestTime: 'Early morning for soft light'
      },
      {
        id: 'city-palace-jaipur',
        name: 'City Palace',
        category: 'Museum',
        image: '/images/places/city-palace-jaipur.jpg',
        description:
          'A royal complex of courtyards, gardens and museums that still houses Jaipur’s former ruling family. Its gates and textiles are a highlight.',
        duration: '2 hours',
        entryFee: 200,
        highlight: 'Chandra Mahal and royal costume gallery',
        bestTime: 'Late morning'
      },
      {
        id: 'jal-mahal',
        name: 'Jal Mahal',
        category: 'Landmark',
        image: '/images/places/jal-mahal.jpg',
        description:
          'A serene water palace set in Man Sagar Lake, best admired from the lakeside promenade. The surrounding hills make it a favourite photography stop.',
        duration: '30–45 minutes',
        entryFee: 0,
        highlight: 'Palace reflected in Man Sagar Lake',
        bestTime: 'Sunset'
      }
    ]
  },
  {
    slug: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    region: 'North India',
    tagline: 'Mughal masterpieces along the Yamuna River.',
    description:
      'Home to the Taj Mahal, Agra rewards a slow visit with mighty red-sandstone forts, riverside gardens and the abandoned city of Fatehpur Sikri nearby.',
    heroImage: '/images/places/taj-mahal.jpg',
    heroAlt: 'The Taj Mahal in Agra',
    imageCredit: 'Wikimedia Commons',
    coordinates: { lat: 27.1767, lng: 78.0081 },
    bestTime: 'October – March',
    idealDays: 2,
    fromPrice: 4999,
    rating: 4.7,
    tags: ['UNESCO', 'History', 'Architecture', 'Photography'],
    languages: ['Hindi', 'Braj', 'English'],
    weather: 'Hot summers and cool, pleasant winters.',
    safetyTip: 'Buy monument tickets only at official counters or authorised online portals.',
    dailyCosts: {
      budgetHotel: 1600,
      standardHotel: 3200,
      premiumHotel: 7000,
      food: 700,
      localTransport: 600,
      activities: 800,
      guide: 1400
    },
    places: [
      {
        id: 'taj-mahal',
        name: 'Taj Mahal',
        category: 'UNESCO',
        image: '/images/places/taj-mahal.jpg',
        description:
          'Shah Jahan’s white-marble masterpiece, built as a mausoleum for Mumtaz Mahal. Its symmetry, pietra dura inlay and changing light are unforgettable.',
        duration: '2–3 hours',
        entryFee: 50,
        highlight: 'Marble mausoleum and formal Mughal gardens',
        bestTime: 'Sunrise'
      },
      {
        id: 'agra-fort',
        name: 'Agra Fort',
        category: 'UNESCO',
        image: '/images/places/agra-fort.jpg',
        description:
          'A monumental red-sandstone Mughal fortress with palaces, audience halls and mosques overlooking a bend in the Yamuna.',
        duration: '2 hours',
        entryFee: 50,
        highlight: 'Diwan-i-Khas and views toward the Taj Mahal',
        bestTime: 'Morning'
      },
      {
        id: 'mehtab-bagh',
        name: 'Mehtab Bagh',
        category: 'Garden',
        image: '/images/places/mehtab-bagh.jpg',
        description:
          'A restored riverside garden aligned with the Taj Mahal, offering a peaceful rear view of the monument across the Yamuna.',
        duration: '1 hour',
        entryFee: 50,
        highlight: 'Unobstructed Taj Mahal view at sunset',
        bestTime: 'Late afternoon'
      },
      {
        id: 'fatehpur-sikri',
        name: 'Fatehpur Sikri',
        category: 'UNESCO',
        image: '/images/places/fatehpur-sikri.jpg',
        description:
          'Akbar’s short-lived 16th-century capital, about 40 km from Agra, preserves grand courtyards, palaces and the towering Buland Darwaza.',
        duration: '3–4 hours',
        entryFee: 50,
        highlight: 'Buland Darwaza and Panch Mahal',
        bestTime: 'Morning day trip'
      }
    ]
  },
  {
    slug: 'kerala',
    name: 'Kerala',
    state: 'Kerala',
    region: 'South India',
    tagline: 'Backwaters, tea hills, wildlife and spice-scented coast.',
    description:
      'Kerala is a journey through contrasting landscapes: houseboat canals in Alappuzha, cool tea estates in Munnar, Chinese fishing nets in Kochi and wildlife around Periyar Lake.',
    heroImage: '/images/places/alleppey-backwaters.jpg',
    heroAlt: 'A houseboat on the Kerala backwaters',
    imageCredit: 'Wikimedia Commons',
    coordinates: { lat: 10.8505, lng: 76.2711 },
    bestTime: 'September – March',
    idealDays: 6,
    fromPrice: 12999,
    rating: 4.9,
    tags: ['Backwaters', 'Nature', 'Wildlife', 'Ayurveda'],
    languages: ['Malayalam', 'English', 'Hindi', 'Tamil'],
    weather: 'Tropical and humid, with monsoon rains from June to September.',
    safetyTip: 'Book houseboats through verified operators and confirm inclusions before boarding.',
    dailyCosts: {
      budgetHotel: 2000,
      standardHotel: 4200,
      premiumHotel: 9000,
      food: 900,
      localTransport: 900,
      activities: 1000,
      guide: 1800
    },
    places: [
      {
        id: 'munnar-tea-gardens',
        name: 'Munnar Tea Gardens',
        category: 'Hill station',
        image: '/images/places/munnar-tea-gardens.jpg',
        description:
          'Rolling tea plantations, misty valleys and cool mountain air make Munnar one of South India’s most loved hill stations.',
        duration: '1–2 days',
        entryFee: 0,
        highlight: 'Tea Museum, viewpoints and Eravikulam National Park',
        bestTime: 'September – May'
      },
      {
        id: 'alleppey-backwaters',
        name: 'Alappuzha Backwaters',
        category: 'Backwaters',
        image: '/images/places/alleppey-backwaters.jpg',
        description:
          'A labyrinth of canals, lagoons and villages best explored on a traditional kettuvallam houseboat or a small canoe.',
        duration: '1 day or overnight',
        entryFee: 0,
        highlight: 'Sunset houseboat cruise and village canals',
        bestTime: 'November – February'
      },
      {
        id: 'fort-kochi',
        name: 'Fort Kochi',
        category: 'Heritage quarter',
        image: '/images/places/fort-kochi.jpg',
        description:
          'A atmospheric coastal neighbourhood of colonial streets, art cafés, spice markets and iconic cantilevered Chinese fishing nets.',
        duration: 'Half day',
        entryFee: 0,
        highlight: 'Chinese fishing nets at sunset',
        bestTime: 'Evening'
      },
      {
        id: 'periyar-national-park',
        name: 'Periyar National Park',
        category: 'Wildlife',
        image: '/images/places/periyar-national-park.jpg',
        description:
          'A protected tiger and elephant landscape around Periyar Lake, with boat safaris, guided forest walks and spice plantations nearby.',
        duration: '1 day',
        entryFee: 45,
        highlight: 'Lake boat safari and guided nature walks',
        bestTime: 'October – April'
      }
    ]
  },
  {
    slug: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    region: 'Himalayas',
    tagline: 'Snow peaks, pine forests, mountain roads and riverside cafés.',
    description:
      'Set in the Beas River valley, Manali is a launchpad for high-altitude passes, meadow walks and winter snow sports. It works equally well for adventure seekers and slow mountain breaks.',
    heroImage: '/images/places/solang-valley.jpg',
    heroAlt: 'Snow-capped mountains and meadows near Solang Valley, Manali',
    imageCredit: 'Wikimedia Commons',
    coordinates: { lat: 32.2396, lng: 77.1887 },
    bestTime: 'March – June, December – February',
    idealDays: 4,
    fromPrice: 9999,
    rating: 4.6,
    tags: ['Mountains', 'Adventure', 'Snow', 'Road trip'],
    languages: ['Hindi', 'Pahari', 'English'],
    weather: 'Cool summers, snowy winters and sudden mountain showers.',
    safetyTip: 'Check road and weather conditions before visiting Rohtang Pass; permits may apply.',
    dailyCosts: {
      budgetHotel: 1800,
      standardHotel: 3800,
      premiumHotel: 8500,
      food: 850,
      localTransport: 1000,
      activities: 1100,
      guide: 1700
    },
    places: [
      {
        id: 'solang-valley',
        name: 'Solang Valley',
        category: 'Adventure',
        image: '/images/places/solang-valley.jpg',
        description:
          'A broad alpine valley about 14 km from Manali, popular for paragliding, zorbing, skiing and panoramic mountain views.',
        duration: 'Half day',
        entryFee: 0,
        highlight: 'Paragliding in summer and snow sports in winter',
        bestTime: 'Morning'
      },
      {
        id: 'rohtang-pass',
        name: 'Rohtang Pass',
        category: 'High-altitude pass',
        image: '/images/places/rohtang-pass.jpg',
        description:
          'A dramatic Himalayan pass on the road toward Lahaul and Spiti, with vast mountain views and snow for much of the year.',
        duration: 'Full day',
        entryFee: 0,
        highlight: 'High mountain vistas and snow points',
        bestTime: 'May – October, weather permitting'
      },
      {
        id: 'hadimba-temple',
        name: 'Hadimba Devi Temple',
        category: 'Temple',
        image: '/images/places/hadimba-temple.jpg',
        description:
          'A distinctive wooden pagoda temple set among towering deodar cedars, dedicated to Hadimba Devi from the Mahabharata.',
        duration: '45–60 minutes',
        entryFee: 0,
        highlight: 'Four-storey wooden architecture in a cedar forest',
        bestTime: 'Morning'
      },
      {
        id: 'manali',
        name: 'Old Manali & Beas River',
        category: 'Neighbourhood',
        image: '/images/places/manali.jpg',
        description:
          'Cross the river into Old Manali for orchard lanes, cafés, backpacker hostels and views of the surrounding peaks.',
        duration: '2–3 hours',
        entryFee: 0,
        highlight: 'Riverside walks and mountain cafés',
        bestTime: 'Late afternoon'
      }
    ]
  },
  {
    slug: 'delhi',
    name: 'Delhi',
    state: 'NCT of Delhi',
    region: 'North India',
    tagline: 'Layered history, monumental avenues and legendary street food.',
    description:
      'India’s capital brings together Mughal, colonial and contemporary India. Explore UNESCO monuments, museum-like neighbourhoods and food trails that stretch from Old Delhi to Connaught Place.',
    heroImage: '/images/places/red-fort.jpg',
    heroAlt: 'The historic Red Fort in Delhi',
    imageCredit: 'Wikimedia Commons',
    coordinates: { lat: 28.6139, lng: 77.209 },
    bestTime: 'October – March',
    idealDays: 3,
    fromPrice: 5999,
    rating: 4.6,
    tags: ['UNESCO', 'History', 'Food', 'Museums'],
    languages: ['Hindi', 'English', 'Punjabi', 'Urdu'],
    weather: 'Very hot summers, monsoon humidity and cool winters.',
    safetyTip: 'Use the Delhi Metro for longer cross-city journeys and keep valuables close in crowded markets.',
    dailyCosts: {
      budgetHotel: 2000,
      standardHotel: 4000,
      premiumHotel: 9000,
      food: 800,
      localTransport: 600,
      activities: 700,
      guide: 1500
    },
    places: [
      {
        id: 'red-fort',
        name: 'Red Fort',
        category: 'UNESCO',
        image: '/images/places/red-fort.jpg',
        description:
          'The ceremonial heart of Mughal Delhi, built by Shah Jahan in red sandstone and backed by museums and riverside gardens.',
        duration: '2 hours',
        entryFee: 50,
        highlight: 'Lahori Gate and the marble palaces',
        bestTime: 'Morning'
      },
      {
        id: 'india-gate',
        name: 'India Gate',
        category: 'Landmark',
        image: '/images/places/india-gate.jpg',
        description:
          'A soaring war memorial at the centre of New Delhi’s ceremonial avenue, surrounded by lawns that come alive in the evening.',
        duration: '30–45 minutes',
        entryFee: 0,
        highlight: 'Illuminated arch and Rajpath lawns',
        bestTime: 'Evening'
      },
      {
        id: 'qutub-minar',
        name: 'Qutub Minar',
        category: 'UNESCO',
        image: '/images/places/qutub-minar.jpg',
        description:
          'A 73-metre brick minaret surrounded by Indo-Islamic ruins, intricate carvings and the mysterious Iron Pillar.',
        duration: '1–2 hours',
        entryFee: 40,
        highlight: 'Fluted red sandstone tower and Quwwat-ul-Islam Mosque',
        bestTime: 'Morning or late afternoon'
      },
      {
        id: 'humayuns-tomb',
        name: 'Humayun’s Tomb',
        category: 'UNESCO',
        image: '/images/places/humayuns-tomb.jpg',
        description:
          'A grand 16th-century Mughal garden tomb whose symmetry and charbagh gardens foreshadowed the Taj Mahal.',
        duration: '1–2 hours',
        entryFee: 40,
        highlight: 'Red sandstone and white marble dome',
        bestTime: 'Late afternoon'
      }
    ]
  }
];

module.exports = destinations;
