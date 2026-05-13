const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/health');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.get('/status', auth, asyncHandler(ctrl.status));

module.exports = router;
