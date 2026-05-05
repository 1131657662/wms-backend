const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/sys_dict');

// 字典类型
router.get('/type/list', auth, requireAdmin, ctrl.listType);
router.post('/type', auth, requireAdmin, ctrl.createType);
router.put('/type/:id', auth, requireAdmin, ctrl.updateType);
router.delete('/type/:id', auth, requireAdmin, ctrl.deleteType);

// 字典数据
router.get('/data/list', auth, requireAdmin, ctrl.listData);
router.post('/data', auth, requireAdmin, ctrl.createData);
router.put('/data/:id', auth, requireAdmin, ctrl.updateData);
router.delete('/data/:id', auth, requireAdmin, ctrl.deleteData);

// 公开接口：根据编码获取字典数据（前端下拉用，非 admin 也可访问）
router.get('/data/:code', auth, ctrl.getDataByCode);

module.exports = router;
