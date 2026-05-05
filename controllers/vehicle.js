const Vehicle = require('../models/vehicle');
const { Op } = require('sequelize');
const logService = require('../services/logService');

function handleDuplicate(err, res) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    const paths = err.errors.map(e => e.path).join(',');
    const msg = err.errors.map(e => e.message).join(',');
    if (paths.includes('plate_number') || msg.includes('plate_number')) return res.status(400).json({ code: 400, message: '车号已存在' });
  }
  return false;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { plate_number: { [Op.like]: `%${keyword}%` } },
        { contact_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 200, message: 'success', data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('车辆列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Vehicle.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '车辆不存在' });
    res.json({ code: 200, message: 'success', data: item });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.search = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = { del_flag: 0, status: 1 };
    if (keyword) {
      where[Op.or] = [
        { plate_number: { [Op.like]: `%${keyword}%` } },
        { contact_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Vehicle.findAll({ where, limit: 20, order: [['id', 'DESC']] });
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    console.error('车辆搜索失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await Vehicle.create({ ...req.body, create_by: req.user.username });
    res.json({ code: 200, message: '创建成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建车辆', operationDesc: `创建车辆「${item.plate_number}」`, businessType: 'vehicle', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    if (handleDuplicate(err, res)) return;
    console.error('创建车辆失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await Vehicle.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '车辆不存在' });
    await item.update({ ...req.body, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑车辆', operationDesc: `编辑车辆「${item.plate_number}」`, businessType: 'vehicle', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    if (handleDuplicate(err, res)) return;
    console.error('更新车辆失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await Vehicle.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '车辆不存在' });
    await item.update({ del_flag: 1, update_by: req.user.username });
    res.json({ code: 200, message: '删除成功' });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除车辆', operationDesc: `删除车辆「${item.plate_number}」`, businessType: 'vehicle', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
