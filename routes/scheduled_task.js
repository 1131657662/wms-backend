const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scheduled_task');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.use(auth, requireAdmin);

router.get('/list', asyncHandler(ctrl.list));
router.put('/:id', asyncHandler(ctrl.update));
router.post('/:id/trigger', asyncHandler(ctrl.trigger));
router.get('/log/list', asyncHandler(ctrl.logList));

module.exports = router;
