'use strict';

const backupService = require('./backup/backupService');
const { BackupError } = require('./backup/backupError');
const { checkAllStocks } = require('../scheduled/stockAlertCheck');

class ScheduledTaskExecutionError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ScheduledTaskExecutionError';
    this.status = status;
  }
}

async function cleanLogs() {
  const { doClean } = require('./sysOperationLogService');
  const { cleanExpiredLoginLogs } = require('./userLoginLogService');
  await doClean();
  await cleanExpiredLoginLogs();
  return '日志清理成功';
}

async function createBackup() {
  const result = await backupService.createBackup();
  return `备份成功：${result.filename}`;
}

const taskExecutors = {
  stock_alert_check: async () => {
    await checkAllStocks();
    return '执行成功';
  },
  auto_backup: createBackup,
  log_cleanup: cleanLogs
};

function canExecuteTask(taskKey) {
  return Boolean(taskExecutors[taskKey]);
}

function publicFailure(err) {
  if (err instanceof BackupError) return { message: err.message, status: err.status };
  return { message: '任务执行失败，请检查服务器日志', status: 500 };
}

async function executeTask(taskKey) {
  const executor = taskExecutors[taskKey];
  if (!executor) throw new ScheduledTaskExecutionError('未找到任务执行函数', 400);
  try {
    return await executor();
  } catch (err) {
    console.error('[定时任务] 手动执行失败', { taskKey, error: err.message });
    const failure = publicFailure(err);
    throw new ScheduledTaskExecutionError(failure.message, failure.status);
  }
}

module.exports = { canExecuteTask, executeTask, ScheduledTaskExecutionError };
