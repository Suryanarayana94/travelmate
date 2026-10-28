const mongoose = require('mongoose');

const SERVICE_TYPES = ['guide', 'transport', 'hotel'];
const PRICE_UNITS = ['day', 'trip', 'night', 'km', 'hour'];

const serviceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seedKey: { type: String, unique: true, sparse: true, index: true },
    type: { type: String, enum: SERVICE_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    destinationSlug: { type: String, required: true, lowercase: true, trim: true, index: true },
    city: { type: String, default: '', trim: true },
    description: { type: String, required: true, maxlength: 1000 },
    image: { type: String, default: '' },
    price: {
      amount: { type: Number, required: true, min: 0 },
      unit: { type: String, enum: PRICE_UNITS, default: 'day' }
    },
    capacity: { type: Number, min: 1, default: 1 },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    languages: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    availability: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 4.7 },
    reviews: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

serviceSchema.index({ type: 1, destinationSlug: 1, availability: 1 });

module.exports = mongoose.model('Service', serviceSchema);
module.exports.SERVICE_TYPES = SERVICE_TYPES;
module.exports.PRICE_UNITS = PRICE_UNITS;
