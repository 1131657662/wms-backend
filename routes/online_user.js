const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/online_user');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/list', auth, requireAdmin, asyncHandler(ctrl.list));
router.post('/kick', auth, requireAdmin, asyncHandler(ctrl.kick));

module.exports = router;
