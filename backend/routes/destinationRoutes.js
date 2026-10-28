const express = require('express');
const { listDestinations, getDestinationBySlug } = require('../controllers/destinationController');

const router = express.Router();

router.get('/', listDestinations);
router.get('/:slug', getDestinationBySlug);

module.exports = router;
