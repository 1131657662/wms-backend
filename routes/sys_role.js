const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sys_role');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/list', auth, requireAdmin, asyncHandler(ctrl.list));
router.post('/', auth, requireAdmin, asyncHandler(ctrl.create));
router.put('/:id', auth, requireAdmin, asyncHandler(ctrl.update));
router.delete('/:id', auth, requireAdmin, asyncHandler(ctrl.remove));
router.get('/:id/permissions', auth, requireAdmin, asyncHandler(ctrl.getPermissions));
router.put('/:id/permissions', auth, requireAdmin, asyncHandler(ctrl.setPermissions));

module.exports = router;
