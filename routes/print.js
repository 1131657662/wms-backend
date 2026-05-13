const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/print');
const { asyncHandler } = require('../utils/asyncHandler');
const { printPostLimiter } = require('../middleware/rateLimit');

router.post(
  '/:templateId/:businessId',
  printPostLimiter,
  auth,
  asyncHandler(ctrl.print)
);

module.exports = router;
