const ScheduledTask = require('../models/scheduled_task');
const ScheduledTaskLog = require('../models/scheduled_task_log');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');
const { ScheduledTaskExecutionError } = require('../services/scheduledTaskExecutionService');
const taskRunService = require('../services/scheduledTaskRunService');
const taskScheduler = require('../scheduled/taskScheduler');

function normalizeEnabled(value, current) {
  if (value === undefined) return current;
  if (value === true || value === 1) return 1;
  if (value === false || value === 0) return 0;
  throw new HttpError(400, 'enabled 只能为 0 或 1');
}

function normalizeCron(value, current) {
  if (value === undefined) return current;
  if (typeof value !== 'string' || !taskScheduler.validateCron(value)) {
    throw new HttpError(400, 'cron 表达式无效');
  }
  return value;
}

// 获取任务列表
exports.list = async (req, res) => {
  try {
    const rows = await ScheduledTask.findAll({ where: { del_flag: 0 }, order: [['id', 'ASC']] });
    return sendSuccess(res, { list: rows, total: rows.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('定时任务列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 更新任务（启用/禁用、修改 cron）
exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');
    const { id } = req.params;
    const task = await ScheduledTask.findOne({ where: { id, del_flag: 0 } });
    if (!task) throw new HttpError(404, '任务不存在');
    const { enabled, cron_expression } = req.body;
    await task.update({
      enabled: normalizeEnabled(enabled, task.enabled),
      cron_expression: normalizeCron(cron_expression, task.cron_expression),
      update_time: new Date()
    });
    taskScheduler.scheduleTask(task);
    return sendSuccess(res, null, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新定时任务失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 手动执行任务
exports.trigger = async (req, res) => {
  const task = await ScheduledTask.findOne({ where: { id: req.params.id, del_flag: 0 } });
  if (!task) throw new HttpError(404, '任务不存在');
  try {
    const result = await taskRunService.runTask(task, 'manual');
    return sendSuccess(res, result, result.message);
  } catch (err) {
    const message = err instanceof ScheduledTaskExecutionError ? err.message : '任务执行失败，请检查服务器日志';
    const status = err instanceof ScheduledTaskExecutionError ? err.status : 500;
    throw new HttpError(status, message, { expose: true });
  }
};

// 执行日志列表
exports.logList = async (req, res) => {
  try {
    const { task_key } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    if (task_key) where.task_key = task_key;

    const { count, rows } = await ScheduledTaskLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('任务日志列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
