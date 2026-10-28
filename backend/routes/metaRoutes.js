const express = require('express');
const { getAppMeta, getHealth } = require('../controllers/metaController');

const router = express.Router();

router.get('/', getAppMeta);
router.get('/health', getHealth);

module.exports = router;
