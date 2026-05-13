const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboard');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('', auth, asyncHandler(ctrl.stats));
router.get('/analysis', auth, asyncHandler(ctrl.analysis));
router.get('/workplace', auth, asyncHandler(ctrl.workplace));

module.exports = router;
