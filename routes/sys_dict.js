const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/sys_dict');
const { asyncHandler } = require('../utils/asyncHandler');

// 字典类型
router.get('/type/list', auth, requireAdmin, asyncHandler(ctrl.listType));
router.post('/type', auth, requireAdmin, asyncHandler(ctrl.createType));
router.put('/type/:id', auth, requireAdmin, asyncHandler(ctrl.updateType));
router.delete('/type/:id', auth, requireAdmin, asyncHandler(ctrl.deleteType));

// 字典数据
router.get('/data/list', auth, requireAdmin, asyncHandler(ctrl.listData));
router.post('/data', auth, requireAdmin, asyncHandler(ctrl.createData));
router.put('/data/:id', auth, requireAdmin, asyncHandler(ctrl.updateData));
router.delete('/data/:id', auth, requireAdmin, asyncHandler(ctrl.deleteData));

// 公开接口：根据编码获取字典数据（前端下拉用，非 admin 也可访问）
router.get('/data/:code', auth, asyncHandler(ctrl.getDataByCode));

module.exports = router;
