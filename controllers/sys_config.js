const SysConfig = require('../models/sys_config');
const { Op } = require('sequelize');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

exports.list = async (req, res) => {
  try {
    const { group } = req.query;
    const where = { del_flag: 0 };
    if (group) where.config_group = group;
    const rows = await SysConfig.findAll({ where, order: [['sort_order', 'ASC']] });
    return sendSuccess(res, rows);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('系统参数列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.groups = async (req, res) => {
  try {
    const rows = await SysConfig.findAll({ attributes: ['config_group'], where: { del_flag: 0 }, group: ['config_group'], raw: true });
    return sendSuccess(res, rows.map(r => r.config_group));
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可修改系统参数');
    const { id, config_value } = req.body;
    const item = await SysConfig.findOne({ where: { id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '参数不存在');
    await clearSoftDeletedConflicts(SysConfig, req.body, ['config_key']);
    await item.update({ config_value, update_time: new Date() });
    return sendSuccess(res, null, '保存成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新系统参数失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
exports.getByKey = async (key) => {
  try {
    const item = await SysConfig.findOne({ where: { config_key: key, del_flag: 0 }, raw: true });
    return item ? item.config_value : null;
  } catch { return null; }
};

// 批量获取，供其他模块使用
exports.getMap = async (keys) => {
  try {
    const items = await SysConfig.findAll({ where: { config_key: { [Op.in]: keys }, del_flag: 0 }, raw: true });
    const map = {};
    items.forEach(i => { map[i.config_key] = i.config_value; });
    return map;
  } catch { return {}; }
};
