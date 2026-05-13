const { Op } = require('sequelize');
const SysDictType = require('../models/sys_dict_type');
const SysDictData = require('../models/sys_dict_data');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

// ===== 字典类型 CRUD =====

exports.listType = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 100);
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { dict_code: { [Op.like]: `%${keyword}%` } },
        { dict_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await SysDictType.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('字典类型列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.createType = async (req, res) => {
  try {
    const { dict_code, dict_name, remark } = req.body;
    if (!dict_code || !dict_name) throw new HttpError(400, '字典编码和名称不能为空');
    const exist = await SysDictType.findOne({ where: { dict_code, del_flag: 0 } });
    if (exist) throw new HttpError(400, '字典编码已存在');
    await clearSoftDeletedConflicts(SysDictType, req.body, ['dict_code']);
    const type = await SysDictType.create({ dict_code, dict_name, remark, create_by: req.user.username });
    return sendSuccess(res, type, '创建成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建字典类型失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.updateType = async (req, res) => {
  try {
    const type = await SysDictType.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!type) throw new HttpError(404, '字典类型不存在');
    const { dict_name, remark } = req.body;
    await clearSoftDeletedConflicts(SysDictType, req.body, ['dict_code']);
    await type.update({ dict_name, remark, update_by: req.user.username });
    return sendSuccess(res, type, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新字典类型失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.deleteType = async (req, res) => {
  try {
    const type = await SysDictType.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!type) throw new HttpError(404, '字典类型不存在');
    await type.update({ del_flag: 1, update_by: req.user.username });
    await SysDictData.update({ del_flag: 1 }, { where: { dict_type_code: type.dict_code } });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('删除字典类型失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// ===== 字典数据 CRUD =====

exports.listData = async (req, res) => {
  try {
    const { dict_type_code } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 100);
    if (!dict_type_code) throw new HttpError(400, '请指定字典类型编码');
    const where = { dict_type_code, del_flag: 0 };
    const { count, rows } = await SysDictData.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('字典数据列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.createData = async (req, res) => {
  try {
    const { dict_type_code, dict_label, dict_value, sort_order, remark, is_enabled } = req.body;
    if (!dict_type_code || !dict_label || dict_value === undefined) {
      throw new HttpError(400, '类型编码、标签和值不能为空');
    }
    const data = await SysDictData.create({
      dict_type_code, dict_label, dict_value,
      sort_order: sort_order || 0,
      is_enabled: is_enabled !== undefined ? is_enabled : 1,
      remark, create_by: req.user.username
    });
    return sendSuccess(res, data, '创建成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建字典数据失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.updateData = async (req, res) => {
  try {
    const data = await SysDictData.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!data) throw new HttpError(404, '字典数据不存在');
    const { dict_label, dict_value, sort_order, is_enabled, remark } = req.body;
    await data.update({ dict_label, dict_value, sort_order, is_enabled, remark, update_by: req.user.username });
    return sendSuccess(res, data, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新字典数据失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.deleteData = async (req, res) => {
  try {
    const data = await SysDictData.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!data) throw new HttpError(404, '字典数据不存在');
    await data.update({ del_flag: 1, update_by: req.user.username });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('删除字典数据失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 根据 dict_type_code 获取已启用的字典数据（供前端下拉使用）
exports.getDataByCode = async (req, res) => {
  try {
    const rows = await SysDictData.findAll({
      where: { dict_type_code: req.params.code, del_flag: 0, is_enabled: 1 },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    return sendSuccess(res, { list: rows, total: rows.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('获取字典数据失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
