const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

const [importProductUpload, importProduct] = ctrl.importProducts;

router.get('/search', auth, hasPermission('basic:view'), asyncHandler(ctrl.search));
router.get('/list', auth, hasPermission('basic:view'), asyncHandler(ctrl.list));
router.get('/export', auth, hasPermission('basic:view'), exportGetLimiter, asyncHandler(ctrl.exportProducts));
router.get('/template', auth, hasPermission('basic:edit'), asyncHandler(ctrl.downloadTemplate));
router.post('/import', auth, hasPermission('basic:edit'), importProductUpload, asyncHandler(importProduct));
router.get('/:id', auth, hasPermission('basic:view'), asyncHandler(ctrl.detail));
router.post('/', auth, hasPermission('basic:edit'), asyncHandler(ctrl.create));
router.put('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.update));
router.delete('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.remove));

module.exports = router;
