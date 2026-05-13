const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/bill_config');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/list', auth, requireAdmin, asyncHandler(ctrl.list));
router.put('/:id', auth, requireAdmin, asyncHandler(ctrl.update));

module.exports = router;
