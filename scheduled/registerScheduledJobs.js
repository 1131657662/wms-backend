'use strict';

const cron = require('node-cron');
const { cleanExpiredBlacklist } = require('../controllers/online_user');
const taskRunService = require('../services/scheduledTaskRunService');
const taskScheduler = require('./taskScheduler');

async function runBlacklistCleanup() {
  try {
    await cleanExpiredBlacklist();
  } catch (err) {
    console.error('黑名单清理任务失败:', err.message);
  }
}

async function runInitialStockCheck(tasks) {
  const task = tasks.find(item => item.task_key === 'stock_alert_check');
  if (!task || Number(task.enabled) !== 1) return;
  try {
    await taskRunService.runTask(task, 'auto');
  } catch (err) {
    console.error('启动库存检查失败:', err.message);
  }
}

async function registerScheduledJobs() {
  const tasks = await taskScheduler.loadTasks();
  cron.schedule('0 */7 * * *', runBlacklistCleanup, { timezone: 'Asia/Shanghai' });
  console.log('数据库配置的定时任务已加载');
  console.log('Token 黑名单清理任务已启动（每7小时）');
  await runInitialStockCheck(tasks);
}

module.exports = { registerScheduledJobs };
