const Warehouse = require('../models/warehouse');
const { Op } = require('sequelize');
const { generateBillNo } = require('../utils/bill_no');
const logService = require('../services/logService');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');

function handleDuplicate(err, res) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    const paths = err.errors.map(e => e.path).join(',');
    const msg = err.errors.map(e => e.message).join(',');
    if (paths.includes('warehouse_code') || msg.includes('warehouse_code')) return res.status(400).json({ code: 400, message: '仓库编码已存在' });
    if (paths.includes('warehouse_name') || msg.includes('warehouse_name')) return res.status(400).json({ code: 400, message: '仓库名称已存在' });
  }
  return false;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, enabled } = req.query;
    const where = { del_flag: 0 };
    if (enabled === '1') where.is_enabled = 1;
    if (keyword) {
      where[Op.or] = [
        { warehouse_code: { [Op.like]: `%${keyword}%` } },
        { warehouse_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Warehouse.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 200, message: 'success', data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('仓库列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Warehouse.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '仓库不存在' });
    res.json({ code: 200, message: 'success', data: item });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    await clearSoftDeletedConflicts(Warehouse, req.body, ['warehouse_code', 'warehouse_name']);
    const warehouse_code = await generateBillNo('warehouse_code');
    const item = await Warehouse.create({ ...req.body, warehouse_code, create_by: req.user.username });
    res.json({ code: 200, message: '创建成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建仓库', operationDesc: `创建仓库「${warehouse_code} ${item.warehouse_name}」`, businessType: 'warehouse', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    if (handleDuplicate(err, res)) return;
    console.error('创建仓库失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    await clearSoftDeletedConflicts(Warehouse, req.body, ['warehouse_code', 'warehouse_name']);
    const item = await Warehouse.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '仓库不存在' });
    await item.update({ ...req.body, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑仓库', operationDesc: `编辑仓库「${item.warehouse_code} ${item.warehouse_name}」`, businessType: 'warehouse', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    if (handleDuplicate(err, res)) return;
    console.error('更新仓库失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await Warehouse.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '仓库不存在' });
    await item.update({ del_flag: 1, update_by: req.user.username });
    res.json({ code: 200, message: '删除成功' });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除仓库', operationDesc: `删除仓库「${item.warehouse_code} ${item.warehouse_name}」`, businessType: 'warehouse', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
