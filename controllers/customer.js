const Customer = require('../models/customer');
const { Op } = require('sequelize');
const { generateBillNo } = require('../utils/bill_no');
const logService = require('../services/logService');

function handleDuplicate(err, res) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    const paths = err.errors.map(e => e.path).join(',');
    const msg = err.errors.map(e => e.message).join(',');
    if (paths.includes('customer_code') || msg.includes('customer_code')) return res.status(400).json({ code: 400, message: '客户编码已存在' });
    if (paths.includes('customer_name') || msg.includes('customer_name')) return res.status(400).json({ code: 400, message: '客户名称已存在' });
  }
  return false;
}

exports.search = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${keyword}%` } },
        { customer_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Customer.findAll({ where, order: [['id', 'DESC']], limit: 20 });
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error('搜索客户失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${keyword}%` } },
        { customer_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 200, message: 'success', data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('客户列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Customer.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '客户不存在' });
    res.json({ code: 200, message: 'success', data: item });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const customer_code = await generateBillNo('customer_code');
    const item = await Customer.create({ ...req.body, customer_code, create_by: req.user.username });
    res.json({ code: 200, message: '创建成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建客户', operationDesc: `创建客户「${customer_code} ${item.customer_name}」`, businessType: 'customer', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    console.error('创建客户失败:', err);
    if (handleDuplicate(err, res)) return;
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await Customer.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '客户不存在' });
    await item.update({ ...req.body, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑客户', operationDesc: `编辑客户「${item.customer_code} ${item.customer_name}」`, businessType: 'customer', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    console.error('更新客户失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await Customer.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '客户不存在' });
    await item.update({ del_flag: 1, update_by: req.user.username });
    res.json({ code: 200, message: '删除成功' });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除客户', operationDesc: `删除客户「${item.customer_code} ${item.customer_name}」`, businessType: 'customer', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
