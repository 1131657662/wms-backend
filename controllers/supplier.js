const Supplier = require('../models/supplier');
const { Op } = require('sequelize');
const { generateBillNo } = require('../utils/bill_no');
const logService = require('../services/logService');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

function throwIfSupplierDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  const paths = err.errors?.map(e => e.path).join(',') || '';
  const msg = err.errors?.map(e => e.message).join(',') || '';
  if (paths.includes('supplier_code') || msg.includes('supplier_code')) {
    throw new HttpError(400, '供应商编码已存在');
  }
  if (paths.includes('supplier_name') || msg.includes('supplier_name')) {
    throw new HttpError(400, '供应商名称已存在');
  }
  throw new HttpError(400, '数据重复');
}

exports.list = async (req, res) => {
  try {
    const { keyword, enabled } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    if (enabled === '1') { where.is_enabled = 1; where.cooperation_status = '合作中'; }
    if (keyword) {
      where[Op.or] = [
        { supplier_code: { [Op.like]: `%${keyword}%` } },
        { supplier_name: { [Op.like]: `%${keyword}%` } },
        { supplier_short: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('供应商列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Supplier.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '供应商不存在');
    return sendSuccess(res, item);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Supplier, req.body, ['supplier_code', 'supplier_name']);
    const supplier_code = await generateBillNo('supplier_code');
    const item = await Supplier.create({ ...req.body, supplier_code, create_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建供应商', operationDesc: `创建供应商「${supplier_code} ${item.supplier_name}」`, businessType: 'supplier', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfSupplierDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建供应商失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Supplier, req.body, ['supplier_code', 'supplier_name']);
    const item = await Supplier.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '供应商不存在');
    await item.update({ ...req.body, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑供应商', operationDesc: `编辑供应商「${item.supplier_code} ${item.supplier_name}」`, businessType: 'supplier', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfSupplierDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新供应商失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await Supplier.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '供应商不存在');
    await item.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除供应商', operationDesc: `删除供应商「${item.supplier_code} ${item.supplier_name}」`, businessType: 'supplier', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};
