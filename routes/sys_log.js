const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/sys_log');
const { asyncHandler } = require('../utils/asyncHandler');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/list', auth, requireAdmin, asyncHandler(ctrl.list));
router.get('/export', auth, requireAdmin, exportGetLimiter, asyncHandler(ctrl.exportLog));
router.get('/recent', auth, asyncHandler(ctrl.recent));
router.delete('/clean', auth, requireAdmin, asyncHandler(ctrl.clean));

module.exports = router;
