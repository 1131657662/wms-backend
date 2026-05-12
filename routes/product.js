const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

router.get('/search', auth, hasPermission('basic:view'), ctrl.search);
router.get('/list', auth, hasPermission('basic:view'), ctrl.list);
router.get('/export', auth, hasPermission('basic:view'), exportGetLimiter, ctrl.exportProducts);
router.get('/template', auth, hasPermission('basic:edit'), ctrl.downloadTemplate);
router.post('/import', auth, hasPermission('basic:edit'), ctrl.importProducts);
router.get('/:id', auth, hasPermission('basic:view'), ctrl.detail);
router.post('/', auth, hasPermission('basic:edit'), ctrl.create);
router.put('/:id', auth, hasPermission('basic:edit'), ctrl.update);
router.delete('/:id', auth, hasPermission('basic:edit'), ctrl.remove);

module.exports = router;
