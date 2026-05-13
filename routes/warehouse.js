const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/warehouse');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');

router.get('/list', auth, hasPermission('basic:view'), asyncHandler(ctrl.list));
router.get('/:id', auth, hasPermission('basic:view'), asyncHandler(ctrl.detail));
router.post('/', auth, hasPermission('basic:edit'), asyncHandler(ctrl.create));
router.put('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.update));
router.delete('/:id', auth, hasPermission('basic:edit'), asyncHandler(ctrl.remove));

module.exports = router;
