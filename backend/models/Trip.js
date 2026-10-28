const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    details: { type: String, default: '' },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const selectedServiceSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    type: { type: String, enum: ['guide', 'transport', 'hotel'] },
    title: { type: String, default: '' },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seedKey: { type: String, unique: true, sparse: true, index: true },
    boardingPoint: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      source: { type: String, default: 'curated' }
    },
    destinationSlug: { type: String, required: true, index: true },
    destinationName: { type: String, default: '' },
    startDate: { type: Date },
    days: { type: Number, required: true, min: 1, max: 30 },
    travelers: { type: Number, required: true, min: 1, max: 30 },
    options: {
      needTransport: { type: Boolean, default: true },
      transportMode: {
        type: String,
        enum: ['bus', 'train', 'flight', 'cab', 'self'],
        default: 'train'
      },
      needHotel: { type: Boolean, default: true },
      hotelTier: { type: String, enum: ['budget', 'standard', 'premium'], default: 'standard' },
      rooms: { type: Number, min: 1, max: 15, default: 1 },
      needGuide: { type: Boolean, default: false },
      guideDays: { type: Number, min: 1, max: 30, default: 1 },
      mealPlan: { type: Boolean, default: true },
      includeActivities: { type: Boolean, default: true }
    },
    estimate: {
      distanceKm: { type: Number, default: 0 },
      roadDistanceKm: { type: Number, default: 0 },
      routeFactor: { type: Number, default: 1 },
      currency: { type: String, default: 'INR' },
      lineItems: { type: [lineItemSchema], default: [] },
      subtotal: { type: Number, default: 0 },
      contingency: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      perPerson: { type: Number, default: 0 },
      assumptions: { type: [String], default: [] },
      generatedAt: { type: Date, default: Date.now },
      disclaimer: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: ['planned', 'booked', 'completed', 'cancelled'],
      default: 'planned',
      index: true
    },
    notes: { type: String, default: '', maxlength: 1000 },
    selectedServices: { type: [selectedServiceSchema], default: [] }
  },
  { timestamps: true }
);

tripSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
