const Destination = require('../models/Destination');
const Trip = require('../models/Trip');
const Service = require('../models/Service');
const { estimateTrip } = require('../services/costService');
const { ApiError, asyncHandler } = require('../middleware/errors');
const { tripView, sendSuccess } = require('../views/responseView');

const findDestination = async (slug) => {
  const destination = await Destination.findOne({ slug: String(slug || '').toLowerCase(), active: true });
  if (!destination) throw new ApiError(404, 'Destination not found');
  return destination;
};

const estimate = asyncHandler(async (req, res) => {
  const slug = req.body.destinationSlug || req.body.destination || req.params.slug;
  if (!slug) throw new ApiError(400, 'Choose a destination to estimate your trip');
  const destination = await findDestination(slug);
  const result = await estimateTrip(destination, req.body);
  sendSuccess(res, result, { message: 'Trip estimate generated' });
});

const createTrip = asyncHandler(async (req, res) => {
  const slug = req.body.destinationSlug || req.body.destination;
  if (!slug) throw new ApiError(400, 'Choose a destination for your trip');
  const destination = await findDestination(slug);

  // Always recalculate on the server so a saved plan cannot carry a tampered total.
  const result = await estimateTrip(destination, req.body);
  const { options } = result;

  const ids = Array.isArray(req.body.selectedServices)
    ? req.body.selectedServices
        .map((item) => (typeof item === 'string' ? item : item?.service || item?.id))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const services = ids.length
    ? await Service.find({ _id: { $in: ids }, availability: true }).select('title type price')
    : [];

  const startDate =
    options.startDate && !Number.isNaN(Date.parse(options.startDate))
      ? new Date(options.startDate)
      : undefined;

  const trip = await Trip.create({
    owner: req.user._id,
    boardingPoint: result.boardingPoint,
    destinationSlug: destination.slug,
    destinationName: destination.name,
    startDate,
    days: options.days,
    travelers: options.travelers,
    options,
    estimate: result.estimate,
    selectedServices: services.map((service) => ({
      service: service._id,
      type: service.type,
      title: service.title,
      amount: service.price.amount
    })),
    notes: String(req.body.notes || '').trim().slice(0, 1000),
    status: 'planned'
  });

  sendSuccess(res, tripView(trip), {
    status: 201,
    message: 'Trip plan saved to your dashboard'
  });
});

const getMyTrips = asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const trips = await Trip.find(filter).sort({ createdAt: -1 }).limit(limit);

  const allTrips = await Trip.find({ owner: req.user._id }).select('estimate.total status startDate');
  const totals = allTrips.reduce(
    (acc, trip) => {
      acc.count += 1;
      acc.estimatedValue += trip.estimate?.total || 0;
      if (trip.status === 'planned') acc.planned += 1;
      return acc;
    },
    { count: 0, estimatedValue: 0, planned: 0 }
  );

  sendSuccess(res, trips.map(tripView), { meta: { ...totals, count: trips.length, total: totals.count } });
});

const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, owner: req.user._id });
  if (!trip) throw new ApiError(404, 'Trip plan not found');
  sendSuccess(res, tripView(trip));
});

const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, owner: req.user._id });
  if (!trip) throw new ApiError(404, 'Trip plan not found');

  const allowedStatuses = ['planned', 'booked', 'completed', 'cancelled'];
  if (req.body.status) {
    if (!allowedStatuses.includes(req.body.status)) throw new ApiError(400, 'Invalid trip status');
    trip.status = req.body.status;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'notes')) {
    trip.notes = String(req.body.notes || '').trim().slice(0, 1000);
  }

  await trip.save();
  sendSuccess(res, tripView(trip), { message: 'Trip plan updated' });
});

const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!trip) throw new ApiError(404, 'Trip plan not found');
  sendSuccess(res, null, { message: 'Trip plan removed' });
});

module.exports = { estimate, createTrip, getMyTrips, getTrip, updateTrip, deleteTrip };
