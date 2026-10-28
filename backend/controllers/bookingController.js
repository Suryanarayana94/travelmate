const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Trip = require('../models/Trip');
const { BOOKING_STATUSES } = require('../models/Booking');
const { ApiError, asyncHandler } = require('../middleware/errors');
const { bookingView, sendSuccess } = require('../views/responseView');

const computeAmount = (service, duration, distanceKm) => {
  const rate = Number(service.price?.amount || 0);
  const unit = service.price?.unit || 'day';
  if (unit === 'km') return Math.round(rate * Math.max(1, distanceKm || 100));
  if (unit === 'trip') return Math.round(rate);
  return Math.round(rate * duration);
};

const populateBooking = (query) =>
  query
    .populate('service', 'title type destinationSlug image price city')
    .populate('provider', 'name email phone role city profileImage')
    .populate('traveller', 'name email phone city profileImage');

const createBooking = asyncHandler(async (req, res) => {
  const {
    serviceId,
    bookingDate,
    duration = 1,
    distanceKm = 0,
    guests = 1,
    note = '',
    contactPhone = '',
    tripId
  } = req.body;

  if (!serviceId || !bookingDate) {
    throw new ApiError(400, 'Choose a service and a booking date');
  }

  const date = new Date(bookingDate);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Enter a valid booking date');

  const service = await Service.findById(serviceId);
  if (!service || !service.availability) throw new ApiError(404, 'This service is no longer available');
  if (String(service.owner) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot book your own service');
  }

  const safeDuration = Math.min(30, Math.max(1, Math.round(Number(duration) || 1)));
  const safeGuests = Math.min(30, Math.max(1, Math.round(Number(guests) || 1)));
  if (safeGuests > service.capacity) {
    throw new ApiError(400, `This service can host up to ${service.capacity} guests`);
  }

  let trip = null;
  if (tripId) {
    trip = await Trip.findOne({ _id: tripId, owner: req.user._id });
    if (!trip) throw new ApiError(400, 'Selected trip plan was not found');
  }

  const booking = await Booking.create({
    traveller: req.user._id,
    provider: service.owner,
    service: service._id,
    serviceTitle: service.title,
    serviceType: service.type,
    destinationSlug: service.destinationSlug,
    trip: trip?._id,
    bookingDate: date,
    duration: safeDuration,
    distanceKm: Math.max(0, Number(distanceKm) || 0),
    guests: safeGuests,
    amount: computeAmount(service, safeDuration, Number(distanceKm) || 0),
    note: String(note).trim().slice(0, 500),
    contactPhone: String(contactPhone || req.user.phone || '').trim(),
    status: 'pending'
  });

  const populated = await populateBooking(Booking.findById(booking._id));
  sendSuccess(res, bookingView(populated), {
    status: 201,
    message: 'Booking request sent to the provider'
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await populateBooking(
    Booking.find({ traveller: req.user._id }).sort({ createdAt: -1 }).limit(100)
  );
  sendSuccess(res, bookings.map(bookingView), { meta: { count: bookings.length } });
});

const getProviderBookings = asyncHandler(async (req, res) => {
  const filter = { provider: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  const bookings = await populateBooking(
    Booking.find(filter).sort({ createdAt: -1 }).limit(100)
  );
  sendSuccess(res, bookings.map(bookingView), { meta: { count: bookings.length } });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const status = String(req.body.status || '');
  if (!BOOKING_STATUSES.includes(status)) throw new ApiError(400, 'Invalid booking status');

  const isTraveller = req.user.role === 'traveller';
  const filter = isTraveller
    ? { _id: req.params.id, traveller: req.user._id }
    : { _id: req.params.id, provider: req.user._id };

  if (isTraveller && status !== 'cancelled') {
    throw new ApiError(403, 'Travellers can only cancel a booking request');
  }

  const booking = await populateBooking(Booking.findOne(filter));
  if (!booking) throw new ApiError(404, 'Booking not found');

  booking.status = status;
  await booking.save();

  sendSuccess(res, bookingView(booking), { message: `Booking marked as ${status}` });
});

module.exports = { createBooking, getMyBookings, getProviderBookings, updateBookingStatus };
