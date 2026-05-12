const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inbound_order');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/list', auth, ctrl.list);
router.get('/export', auth, exportGetLimiter, ctrl.exportInboundOrders);
router.get('/export/:id', auth, exportGetLimiter, ctrl.exportInboundOrderDetail);
router.get('/search', auth, ctrl.search);
router.get('/:id', auth, ctrl.detail);
router.post('/', auth, hasPermission('inbound:create'), ctrl.create);
router.put('/:id', auth, hasPermission('inbound:edit'), ctrl.update);
router.delete('/:id', auth, hasPermission('inbound:edit'), ctrl.remove);
router.post('/:id/submit', auth, hasPermission('inbound:edit'), ctrl.submit);
router.post('/batch-audit', auth, hasPermission('inbound:audit'), ctrl.batchAudit);
router.post('/:id/audit', auth, hasPermission('inbound:audit'), ctrl.audit);
router.post('/:id/revert', auth, hasPermission('inbound:audit'), ctrl.revert);

module.exports = router;
