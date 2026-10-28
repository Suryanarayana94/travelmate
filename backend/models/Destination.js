const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const placeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Landmark' },
    image: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, default: '' },
    entryFee: { type: Number, default: 0 },
    highlight: { type: String, default: '' },
    bestTime: { type: String, default: '' }
  },
  { _id: false }
);

const dailyCostsSchema = new mongoose.Schema(
  {
    budgetHotel: { type: Number, required: true },
    standardHotel: { type: Number, required: true },
    premiumHotel: { type: Number, required: true },
    food: { type: Number, required: true },
    localTransport: { type: Number, required: true },
    activities: { type: Number, required: true },
    guide: { type: Number, required: true }
  },
  { _id: false }
);

const destinationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    state: { type: String, required: true },
    region: { type: String, default: '' },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    heroImage: { type: String, required: true },
    heroAlt: { type: String, default: '' },
    imageCredit: { type: String, default: 'Wikimedia Commons' },
    coordinates: { type: pointSchema, required: true },
    bestTime: { type: String, default: '' },
    idealDays: { type: Number, default: 3 },
    fromPrice: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    tags: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    weather: { type: String, default: '' },
    safetyTip: { type: String, default: '' },
    dailyCosts: { type: dailyCostsSchema, required: true },
    places: { type: [placeSchema], default: [] },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Destination', destinationSchema);
