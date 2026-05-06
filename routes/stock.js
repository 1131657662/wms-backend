const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const ctrl = require('../controllers/stock');

router.get('/warehouse-summary', auth, hasPermission('stock:view'), ctrl.warehouseSummary);
router.get('/check', auth, ctrl.check);
router.put('/:id', auth, hasPermission('basic:edit'), ctrl.update);
router.post('/:id/adjust', auth, hasPermission('stock:edit'), ctrl.adjust);
router.get('/list', auth, hasPermission('stock:view'), ctrl.list);
router.get('/export', auth, hasPermission('stock:export'), ctrl.exportStock);
router.get('/journal/list', auth, hasPermission('stock:view'), ctrl.journalList);
router.get('/journal/export', auth, hasPermission('stock:view'), ctrl.exportJournal);
router.get('/template', auth, ctrl.downloadTemplate);
router.post('/import', auth, hasPermission('stock:edit'), ctrl.importStock);
router.post('/clear-zero', auth, hasPermission('stock:edit'), ctrl.clearZeroStock);
router.post('/rebuild', auth, hasPermission('stock:admin'), ctrl.rebuildFromJournals);
router.post('/reset', auth, hasPermission('stock:admin'), ctrl.resetStock);
// DELETE /:id removed: 库存由流水驱动，不允许直接删除

module.exports = router;
