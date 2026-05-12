const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/sys_log');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/list', auth, requireAdmin, ctrl.list);
router.get('/export', auth, requireAdmin, exportGetLimiter, ctrl.exportLog);
router.get('/recent', auth, ctrl.recent);
router.delete('/clean', auth, requireAdmin, ctrl.clean);

module.exports = router;
