const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/outbound_order');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/list', auth, asyncHandler(ctrl.list));
router.get('/export', auth, exportGetLimiter, asyncHandler(ctrl.exportOutboundOrders));
router.get('/export/:id', auth, exportGetLimiter, asyncHandler(ctrl.exportOutboundOrderDetail));
router.get('/search', auth, asyncHandler(ctrl.search));
router.get('/:id', auth, asyncHandler(ctrl.detail));
router.post('/', auth, hasPermission('outbound:create'), asyncHandler(ctrl.create));
router.put('/:id', auth, hasPermission('outbound:edit'), asyncHandler(ctrl.update));
router.delete('/:id', auth, hasPermission('outbound:edit'), asyncHandler(ctrl.remove));
router.post('/:id/submit', auth, hasPermission('outbound:edit'), asyncHandler(ctrl.submit));
router.post('/batch-audit', auth, hasPermission('outbound:audit'), asyncHandler(ctrl.batchAudit));
router.post('/:id/audit', auth, hasPermission('outbound:audit'), asyncHandler(ctrl.audit));
router.post('/:id/revert', auth, hasPermission('outbound:audit'), asyncHandler(ctrl.revert));

module.exports = router;
