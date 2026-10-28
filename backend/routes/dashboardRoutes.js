const express = require('express');
const { getSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getSummary);

module.exports = router;
