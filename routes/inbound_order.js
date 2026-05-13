const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inbound_order');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/list', auth, asyncHandler(ctrl.list));
router.get('/export', auth, exportGetLimiter, asyncHandler(ctrl.exportInboundOrders));
router.get('/export/:id', auth, exportGetLimiter, asyncHandler(ctrl.exportInboundOrderDetail));
router.get('/search', auth, asyncHandler(ctrl.search));
router.get('/:id', auth, asyncHandler(ctrl.detail));
router.post('/', auth, hasPermission('inbound:create'), asyncHandler(ctrl.create));
router.put('/:id', auth, hasPermission('inbound:edit'), asyncHandler(ctrl.update));
router.delete('/:id', auth, hasPermission('inbound:edit'), asyncHandler(ctrl.remove));
router.post('/:id/submit', auth, hasPermission('inbound:edit'), asyncHandler(ctrl.submit));
router.post('/batch-audit', auth, hasPermission('inbound:audit'), asyncHandler(ctrl.batchAudit));
router.post('/:id/audit', auth, hasPermission('inbound:audit'), asyncHandler(ctrl.audit));
router.post('/:id/revert', auth, hasPermission('inbound:audit'), asyncHandler(ctrl.revert));

module.exports = router;
