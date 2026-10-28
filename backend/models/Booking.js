const mongoose = require('mongoose');

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seedKey: { type: String, unique: true, sparse: true, index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    serviceTitle: { type: String, default: '' },
    serviceType: { type: String, enum: ['guide', 'transport', 'hotel', ''], default: '' },
    destinationSlug: { type: String, default: '' },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    bookingDate: { type: Date, required: true },
    duration: { type: Number, min: 1, max: 30, default: 1 },
    distanceKm: { type: Number, min: 0, default: 0 },
    guests: { type: Number, required: true, min: 1, max: 30, default: 1 },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: '', maxlength: 500 },
    contactPhone: { type: String, default: '' },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true }
  },
  { timestamps: true }
);

bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ traveller: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
