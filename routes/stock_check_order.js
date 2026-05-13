const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/stock_check_order');
const { asyncHandler } = require('../utils/asyncHandler');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/list', auth, asyncHandler(ctrl.list));
router.get('/export', auth, exportGetLimiter, asyncHandler(ctrl.exportCheckOrders));
router.get('/:id', auth, asyncHandler(ctrl.detail));
router.post('/', auth, asyncHandler(ctrl.create));
router.put('/:id', auth, asyncHandler(ctrl.update));
router.delete('/:id', auth, asyncHandler(ctrl.remove));
router.post('/:id/confirm', auth, asyncHandler(ctrl.confirm));
router.post('/:id/void', auth, asyncHandler(ctrl.voidOrder));
router.post('/:id/adjust', auth, asyncHandler(ctrl.adjust));

module.exports = router;
