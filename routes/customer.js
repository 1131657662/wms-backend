const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customer');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

const [importCustomerUpload, importCustomer] = ctrl.importCustomers;

router.get('/search', auth, hasPermission('basic:view'), asyncHandler(ctrl.search));
router.get('/suggest', auth, hasPermission('basic:view'), asyncHandler(ctrl.suggest));
router.get('/list', auth, hasPermission('basic:view'), asyncHandler(ctrl.list));
router.get('/template', auth, asyncHandler(ctrl.downloadTemplate));
router.get('/export/data', auth, hasPermission('basic:export'), exportGetLimiter, asyncHandler(ctrl.exportCustomers));
router.post('/import', auth, hasPermission('basic:edit'), importCustomerUpload, asyncHandler(importCustomer));
router.get('/:id', auth, hasPermission('basic:view'), asyncHandler(ctrl.detail));
router.post('/', auth, hasPermission('basic:edit'), asyncHandler(ctrl.create));
router.put('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.update));
router.delete('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.remove));

module.exports = router;
