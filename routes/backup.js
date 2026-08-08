const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/backup');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

const { exportGetLimiter } = require('../middleware/rateLimit');

router.use(auth, requireAdmin);

router.post('/create', asyncHandler(ctrl.create));
router.get('/list', asyncHandler(ctrl.list));
router.get('/download/:filename', exportGetLimiter, asyncHandler(ctrl.download));
router.post('/restore', asyncHandler(ctrl.restore));
router.delete('/:filename', asyncHandler(ctrl.remove));

module.exports = router;
