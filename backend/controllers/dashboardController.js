const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Trip = require('../models/Trip');
const { asyncHandler } = require('../middleware/errors');
const { bookingView, sendSuccess } = require('../views/responseView');

const sumAmounts = async (match) => {
  const [result] = await Booking.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result?.total || 0;
};

const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  if (role === 'traveller') {
    const [tripCount, bookingCount, plannedCount, estimatedValue, confirmedSpend, recentBookings] =
      await Promise.all([
        Trip.countDocuments({ owner: userId }),
        Booking.countDocuments({ traveller: userId }),
        Trip.countDocuments({ owner: userId, status: 'planned' }),
        Trip.aggregate([
          { $match: { owner: userId } },
          { $group: { _id: null, total: { $sum: '$estimate.total' } } }
        ]),
        sumAmounts({ traveller: userId, status: { $in: ['confirmed', 'completed'] } }),
        Booking.find({ traveller: userId })
          .populate('service', 'title type image destinationSlug')
          .populate('provider', 'name email phone role city')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

    return sendSuccess(res, {
      role,
      cards: [
        { label: 'Saved trip plans', value: tripCount, hint: `${plannedCount} ready to book`, icon: 'map' },
        { label: 'Booking requests', value: bookingCount, hint: 'Across all providers', icon: 'calendar' },
        {
          label: 'Planned trip value',
          value: estimatedValue[0]?.total || 0,
          hint: 'Sum of saved estimates',
          icon: 'wallet',
          currency: true
        },
        {
          label: 'Confirmed spend',
          value: confirmedSpend,
          hint: 'Confirmed + completed bookings',
          icon: 'check',
          currency: true
        }
      ],
      recentBookings: recentBookings.map(bookingView)
    });
  }

  const [serviceCount, pendingCount, confirmedCount, earnings, views, recentBookings] =
    await Promise.all([
      Service.countDocuments({ owner: userId }),
      Booking.countDocuments({ provider: userId, status: 'pending' }),
      Booking.countDocuments({ provider: userId, status: { $in: ['confirmed', 'completed'] } }),
      sumAmounts({ provider: userId, status: { $in: ['confirmed', 'completed'] } }),
      Booking.countDocuments({ provider: userId }),
      Booking.find({ provider: userId })
        .populate('service', 'title type image destinationSlug')
        .populate('traveller', 'name email phone city profileImage')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

  sendSuccess(res, {
    role,
    cards: [
      { label: 'Published services', value: serviceCount, hint: 'Visible in the marketplace', icon: 'briefcase' },
      { label: 'Pending requests', value: pendingCount, hint: 'Waiting for your response', icon: 'clock' },
      { label: 'Confirmed bookings', value: confirmedCount, hint: `${views} total enquiries`, icon: 'check' },
      { label: 'Confirmed earnings', value: earnings, hint: 'Based on booking amounts', icon: 'wallet', currency: true }
    ],
    recentBookings: recentBookings.map(bookingView)
  });
});

module.exports = { getSummary };
