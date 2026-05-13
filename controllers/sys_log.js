const { Op } = require('sequelize');
const SysOperationLog = require('../models/sys_operation_log');
const ExcelJS = require('exceljs');
const SysConfig = require('../models/sys_config');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

// 核心清理逻辑，供 API 和定时任务共用
async function doClean() {
  const cfg = await SysConfig.findOne({ where: { config_key: 'log_retention_days' } });
  const days = parseInt((cfg && cfg.config_value) || 90);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
  const deleted = await SysOperationLog.destroy({ where: { create_time: { [Op.lt]: cutoff } } });
  console.log(`[日志清理] 删除 ${deleted} 条 ${days} 天前的操作日志（截止 ${cutoff}）`);
  return { deleted, days, cutoff };
}

exports.doClean = doClean;

exports.clean = async (req, res) => {
  try {
    const result = await doClean();
    return sendSuccess(res, result);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('日志清理失败:', err);
    throw new HttpError(500, '清理失败', { expose: true });
  }
};

function buildWhere(query) {
  const { username, module, modules, businessType, startDate, endDate, method, status, keyword } = query;
  const conditions = [];

  if (username) conditions.push({ username: { [Op.like]: `%${username}%` } });
  if (module) conditions.push({ module });
  if (modules) conditions.push({ module: { [Op.in]: modules.split(',') } });
  if (businessType) conditions.push({ business_type: businessType });
  if (method) conditions.push({ method });
  if (status !== undefined && status !== '') conditions.push({ status: Number(status) });

  if (startDate && endDate) {
    conditions.push({ create_time: { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] } });
  } else if (startDate) {
    conditions.push({ create_time: { [Op.gte]: startDate + ' 00:00:00' } });
  } else if (endDate) {
    conditions.push({ create_time: { [Op.lte]: endDate + ' 23:59:59' } });
  }

  if (keyword) {
    conditions.push({
      [Op.or]: [
        { operation_desc: { [Op.like]: `%${keyword}%` } },
        { request_url: { [Op.like]: `%${keyword}%` } },
        { operation: { [Op.like]: `%${keyword}%` } }
      ]
    });
  }

  return conditions.length > 0 ? { [Op.and]: conditions } : {};
}

exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const where = buildWhere(req.query);

    const { count, rows } = await SysOperationLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize)
    });

    return sendSuccess(res, { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('操作日志列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.recent = async (req, res) => {
  try {
    const rows = await SysOperationLog.findAll({
      where: { username: req.user.username },
      order: [['id', 'DESC']],
      limit: 10
    });
    return sendSuccess(res, rows);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('最近日志查询失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportLog = async (req, res) => {
  try {
    const where = buildWhere(req.query);

    const rows = await SysOperationLog.findAll({ where, order: [['id', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('操作日志');
    sheet.columns = [
      { header: '用户名', key: 'username', width: 15 },
      { header: '模块', key: 'module', width: 12 },
      { header: '操作描述', key: 'operation_desc', width: 40 },
      { header: '业务类型', key: 'business_type', width: 12 },
      { header: '业务ID', key: 'business_id', width: 16 },
      { header: '请求路径', key: 'request_url', width: 30 },
      { header: '方法', key: 'method', width: 8 },
      { header: 'IP', key: 'ip', width: 18 },
      { header: '耗时(ms)', key: 'cost_time', width: 12 },
      { header: '状态', key: 'status', width: 8 },
      { header: '错误信息', key: 'error_msg', width: 30 },
      { header: '时间', key: 'create_time', width: 20 }
    ];

    rows.forEach(r => {
      const d = r.toJSON();
      d.status = d.status === 1 ? '成功' : '失败';
      sheet.addRow(d);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=operation_log.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出操作日志失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};
