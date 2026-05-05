const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/outbound_order');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');

router.get('/list', auth, ctrl.list);
router.get('/export', auth, ctrl.exportOutboundOrders);
router.get('/export/:id', auth, ctrl.exportOutboundOrderDetail);
router.get('/:id', auth, ctrl.detail);
router.post('/', auth, hasPermission('outbound:create'), ctrl.create);
router.put('/:id', auth, hasPermission('outbound:edit'), ctrl.update);
router.delete('/:id', auth, hasPermission('outbound:edit'), ctrl.remove);
router.post('/:id/submit', auth, hasPermission('outbound:edit'), ctrl.submit);
router.post('/batch-audit', auth, hasPermission('outbound:audit'), ctrl.batchAudit);
router.post('/:id/audit', auth, hasPermission('outbound:audit'), ctrl.audit);
router.post('/:id/revert', auth, hasPermission('outbound:audit'), ctrl.revert);

module.exports = router;
