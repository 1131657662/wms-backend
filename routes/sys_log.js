const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/sys_log');

router.get('/list', auth, requireAdmin, ctrl.list);
router.get('/export', auth, requireAdmin, ctrl.exportLog);
router.get('/recent', auth, ctrl.recent);
router.delete('/clean', auth, requireAdmin, ctrl.clean);

module.exports = router;
