const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const ctrl = require('../controllers/stock');
const { asyncHandler } = require('../utils/asyncHandler');
const { exportGetLimiter } = require('../middleware/rateLimit');

const [importStockUpload, importStock] = ctrl.importStock;

router.get('/warehouse-summary', auth, hasPermission('stock:view'), asyncHandler(ctrl.warehouseSummary));
router.get('/check', auth, asyncHandler(ctrl.check));
router.put('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.update));
router.post('/:id/adjust', auth, hasPermission('stock:edit'), asyncHandler(ctrl.adjust));
router.get('/list', auth, hasPermission('stock:view'), asyncHandler(ctrl.list));
router.get('/export', auth, hasPermission('stock:export'), exportGetLimiter, asyncHandler(ctrl.exportStock));
router.get('/journal/list', auth, hasPermission('stock:view'), asyncHandler(ctrl.journalList));
router.get('/journal/export', auth, hasPermission('stock:view'), exportGetLimiter, asyncHandler(ctrl.exportJournal));
router.get('/template', auth, asyncHandler(ctrl.downloadTemplate));
router.post('/import', auth, hasPermission('stock:edit'), importStockUpload, asyncHandler(importStock));
router.post('/clear-zero', auth, hasPermission('stock:edit'), asyncHandler(ctrl.clearZeroStock));
router.post('/rebuild', auth, hasPermission('stock:admin'), asyncHandler(ctrl.rebuildFromJournals));
router.post('/reset', auth, hasPermission('stock:admin'), asyncHandler(ctrl.resetStock));
// DELETE /:id removed: 库存由流水驱动，不允许直接删除

module.exports = router;
