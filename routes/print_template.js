const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/print_template');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/by-page/:pageCode', auth, asyncHandler(ctrl.byPage));
router.get('/list', auth, requireAdmin, asyncHandler(ctrl.list));
router.post('', auth, requireAdmin, asyncHandler(ctrl.create));
router.put('/:id', auth, requireAdmin, asyncHandler(ctrl.update));
router.delete('/:id', auth, requireAdmin, asyncHandler(ctrl.remove));

module.exports = router;
