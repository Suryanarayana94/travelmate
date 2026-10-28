const express = require('express');
const {
  estimate,
  createTrip,
  getMyTrips,
  getTrip,
  updateTrip,
  deleteTrip
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/estimate', estimate);

router.use(protect);
router.get('/', getMyTrips);
router.post('/', createTrip);
router.get('/:id', getTrip);
router.patch('/:id', updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;
