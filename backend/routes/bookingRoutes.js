const express = require('express');
const {
  createBooking,
  getMyBookings,
  getProviderBookings,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { SERVICE_TYPES } = require('../models/Service');

const router = express.Router();

router.use(protect);
router.post('/', authorize('traveller'), createBooking);
router.get('/mine', authorize('traveller'), getMyBookings);
router.get('/provider', authorize(...SERVICE_TYPES), getProviderBookings);
router.patch('/:id/status', authorize('traveller', ...SERVICE_TYPES), updateBookingStatus);

module.exports = router;
