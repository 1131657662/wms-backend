const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicle');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');
const { exportGetLimiter } = require('../middleware/rateLimit');

const [importVehicleUpload, importVehicle] = ctrl.importVehicles;

router.get('/search', auth, hasPermission('basic:view'), asyncHandler(ctrl.search));
router.get('/list', auth, hasPermission('basic:view'), asyncHandler(ctrl.list));
router.get('/template', auth, asyncHandler(ctrl.downloadTemplate));
router.get('/export/data', auth, hasPermission('basic:export'), exportGetLimiter, asyncHandler(ctrl.exportVehicles));
router.post('/import', auth, hasPermission('basic:edit'), importVehicleUpload, asyncHandler(importVehicle));
router.get('/:id', auth, hasPermission('basic:view'), asyncHandler(ctrl.detail));
router.post('/', auth, hasPermission('basic:edit'), asyncHandler(ctrl.create));
router.put('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.update));
router.delete('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.remove));

module.exports = router;
