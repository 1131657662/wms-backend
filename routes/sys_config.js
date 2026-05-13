const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sys_config');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.get('/list', auth, asyncHandler(ctrl.list));
router.get('/groups', auth, asyncHandler(ctrl.groups));
router.put('/update', auth, asyncHandler(ctrl.update));

module.exports = router;
