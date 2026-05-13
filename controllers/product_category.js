const ProductCategory = require('../models/product_category');
const { Op } = require('sequelize');
const logService = require('../services/logService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

function throwIfCategoryDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  throw new HttpError(400, '同级分类已存在相同名称');
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
    return sendSuccess(res, tree);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('商品分类树失败:', err);
    return sendError(res, 500, '服务器内部错误');
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
    return sendSuccess(res, { list: tree });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('商品分类列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await ProductCategory.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '分类不存在');
    return sendSuccess(res, item);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    // 清除与复合唯一键冲突的软删除记录
    if (req.body.parent_id != null && req.body.category_name) {
      await ProductCategory.destroy({ where: { del_flag: 1, parent_id: req.body.parent_id, category_name: req.body.category_name }, force: true });
    }
    const item = await ProductCategory.create({ ...req.body, create_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建商品分类', operationDesc: `创建商品分类「${item.category_name}」`, businessType: 'product_category', businessId: String(item.id), method: 'POST', ip: req.ip, status: 1 });
    return sendSuccess(res, item, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfCategoryDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建分类失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await ProductCategory.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '分类不存在');
    // 清除与复合唯一键冲突的软删除记录
    if (req.body.parent_id != null && req.body.category_name) {
      await ProductCategory.destroy({ where: { del_flag: 1, parent_id: req.body.parent_id, category_name: req.body.category_name }, force: true });
    }
    await item.update({ ...req.body, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑商品分类', operationDesc: `编辑商品分类「${item.category_name}」`, businessType: 'product_category', businessId: String(item.id), method: 'PUT', ip: req.ip, status: 1 });
    return sendSuccess(res, item, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfCategoryDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新分类失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await ProductCategory.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '分类不存在');
    await item.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除商品分类', operationDesc: `删除商品分类「${item.category_name}」`, businessType: 'product_category', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};
