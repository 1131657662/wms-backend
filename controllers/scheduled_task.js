const ScheduledTask = require('../models/scheduled_task');
const ScheduledTaskLog = require('../models/scheduled_task_log');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

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
    await clearSoftDeletedConflicts(ScheduledTask, req.body, ['task_key']);
    await task.update({
      enabled: enabled !== undefined ? enabled : task.enabled,
      cron_expression: cron_expression || task.cron_expression,
      update_time: new Date()
    });
    return sendSuccess(res, null, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新定时任务失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 手动执行任务
exports.trigger = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await ScheduledTask.findOne({ where: { id, del_flag: 0 } });
    if (!task) throw new HttpError(404, '任务不存在');

    const startTime = new Date();
    const logEntry = await ScheduledTaskLog.create({
      task_key: task.task_key,
      task_name: task.task_name,
      trigger_type: 'manual',
      status: 'running',
      start_time: startTime
    });

    let status = 'success';
    let resultMessage = '执行成功';

    try {
      if (task.task_key === 'stock_alert_check') {
        const { checkAllStocks } = require('../scheduled/stockAlertCheck');
        await checkAllStocks();
      } else {
        status = 'failed';
        resultMessage = '未找到任务执行函数';
      }
    } catch (e) {
      status = 'failed';
      resultMessage = e.message;
    }

    const endTime = new Date();
    await logEntry.update({
      status,
      result_message: resultMessage,
      end_time: endTime,
      duration_ms: endTime - startTime
    });

    await task.update({ last_run_time: new Date(), update_time: new Date() });

    return sendSuccess(res, { status, duration_ms: endTime - startTime }, resultMessage);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('手动执行任务失败:', err);
    return sendError(res, 500, '服务器内部错误');
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