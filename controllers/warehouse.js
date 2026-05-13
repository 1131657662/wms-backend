const Warehouse = require('../models/warehouse');
const { Op } = require('sequelize');
const { generateBillNo } = require('../utils/bill_no');
const logService = require('../services/logService');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

function throwIfWarehouseDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  const paths = err.errors?.map(e => e.path).join(',') || '';
  const msg = err.errors?.map(e => e.message).join(',') || '';
  if (paths.includes('warehouse_code') || msg.includes('warehouse_code')) {
    throw new HttpError(400, '仓库编码已存在');
  }
  if (paths.includes('warehouse_name') || msg.includes('warehouse_name')) {
    throw new HttpError(400, '仓库名称已存在');
  }
  throw new HttpError(400, '数据重复');
}

exports.list = async (req, res) => {
  try {
    const { keyword, enabled } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
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
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('仓库列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Warehouse.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '仓库不存在');
    return sendSuccess(res, item);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Warehouse, req.body, ['warehouse_code', 'warehouse_name']);
    const warehouse_code = await generateBillNo('warehouse_code');
    const item = await Warehouse.create({ ...req.body, warehouse_code, create_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建仓库', operationDesc: `创建仓库「${warehouse_code} ${item.warehouse_name}」`, businessType: 'warehouse', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfWarehouseDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建仓库失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Warehouse, req.body, ['warehouse_code', 'warehouse_name']);
    const item = await Warehouse.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '仓库不存在');
    await item.update({ ...req.body, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑仓库', operationDesc: `编辑仓库「${item.warehouse_code} ${item.warehouse_name}」`, businessType: 'warehouse', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfWarehouseDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新仓库失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await Warehouse.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '仓库不存在');
    await item.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除仓库', operationDesc: `删除仓库「${item.warehouse_code} ${item.warehouse_name}」`, businessType: 'warehouse', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};
