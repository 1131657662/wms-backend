const ProductCategory = require('../models/product_category');
const { Op } = require('sequelize');
const logService = require('../services/logService');

function handleDuplicate(err, res) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ code: 400, message: '同级分类已存在相同名称' });
  }
  return false;
}

// 递归构建树
function buildTree(list, parentId = 0) {
  return list
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(item => ({
      ...item.toJSON(),
      children: buildTree(list, item.id)
    }));
}

exports.tree = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where.category_name = { [Op.like]: `%${keyword}%` };
    }
    const rows = await ProductCategory.findAll({ where, order: [['sort_order', 'ASC']] });
    const tree = buildTree(rows, 0);
    res.json({ code: 200, message: 'success', data: tree });
  } catch (err) {
    console.error('商品分类树失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.list = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where.category_name = { [Op.like]: `%${keyword}%` };
    }
    const rows = await ProductCategory.findAll({ where, order: [['sort_order', 'ASC']] });
    const tree = buildTree(rows, 0);
    res.json({ code: 200, message: 'success', data: { list: tree } });
  } catch (err) {
    console.error('商品分类列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await ProductCategory.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '分类不存在' });
    res.json({ code: 200, message: 'success', data: item });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await ProductCategory.create({ ...req.body, create_by: req.user.username });
    res.json({ code: 200, message: '创建成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建商品分类', operationDesc: `创建商品分类「${item.category_name}」`, businessType: 'product_category', businessId: String(item.id), method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    if (handleDuplicate(err, res)) return;
    console.error('创建分类失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await ProductCategory.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '分类不存在' });
    await item.update({ ...req.body, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data: item });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑商品分类', operationDesc: `编辑商品分类「${item.category_name}」`, businessType: 'product_category', businessId: String(item.id), method: 'PUT', ip: req.ip, status: 1 });
  } catch (err) {
    if (handleDuplicate(err, res)) return;
    console.error('更新分类失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') return res.status(403).json({ code: 403, message: '无权限' });
    const item = await ProductCategory.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) return res.status(404).json({ code: 404, message: '分类不存在' });
    await item.update({ del_flag: 1, update_by: req.user.username });
    res.json({ code: 200, message: '删除成功' });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除商品分类', operationDesc: `删除商品分类「${item.category_name}」`, businessType: 'product_category', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
