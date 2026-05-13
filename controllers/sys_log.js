const {
  doClean,
  listPage,
  recentByUsername,
  exportRows,
  buildExportWorkbook
} = require('../services/sysOperationLogService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

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

exports.list = async (req, res) => {
  try {
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const { count, rows } = await listPage({ page, pageSize, query: req.query });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('操作日志列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.recent = async (req, res) => {
  try {
    const rows = await recentByUsername(req.user.username);
    return sendSuccess(res, { list: rows, total: rows.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('最近日志查询失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportLog = async (req, res) => {
  try {
    const rows = await exportRows(req.query);
    const workbook = buildExportWorkbook(rows);
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
