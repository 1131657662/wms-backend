const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const ctrl = require('../controllers/stock');

router.get('/check', auth, ctrl.check);
router.put('/:id', auth, hasPermission('basic:edit'), ctrl.update);
router.post('/:id/adjust', auth, hasPermission('stock:edit'), ctrl.adjust);
router.get('/list', auth, hasPermission('stock:view'), ctrl.list);
router.get('/export', auth, hasPermission('stock:export'), ctrl.exportStock);
router.get('/journal/list', auth, hasPermission('stock:view'), ctrl.journalList);
router.get('/journal/export', auth, hasPermission('stock:view'), ctrl.exportJournal);
router.get('/template', auth, ctrl.downloadTemplate);
router.post('/import', auth, ctrl.importStock);

module.exports = router;
