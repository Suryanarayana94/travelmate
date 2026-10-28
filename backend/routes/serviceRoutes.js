const express = require('express');
const {
  listServices,
  getServiceById,
  getMyServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const { SERVICE_TYPES } = require('../models/Service');

const router = express.Router();

router.get('/', listServices);

router.use(protect);
router.get('/mine', authorize(...SERVICE_TYPES), getMyServices);
router.get('/:id', getServiceById);

router.post('/', authorize(...SERVICE_TYPES), createService);
router.patch('/:id', authorize(...SERVICE_TYPES), updateService);
router.delete('/:id', authorize(...SERVICE_TYPES), deleteService);

module.exports = router;
