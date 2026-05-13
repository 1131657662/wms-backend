const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scheduled_task');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.get('/list', auth, asyncHandler(ctrl.list));
router.put('/:id', auth, asyncHandler(ctrl.update));
router.post('/:id/trigger', auth, asyncHandler(ctrl.trigger));
router.get('/log/list', auth, asyncHandler(ctrl.logList));

module.exports = router;
