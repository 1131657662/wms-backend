'use strict';

const cron = require('node-cron');
const ScheduledTask = require('../models/scheduled_task');
const { canExecuteTask } = require('../services/scheduledTaskExecutionService');
const taskRunService = require('../services/scheduledTaskRunService');

function createTaskScheduler(overrides = {}) {
  const cronLibrary = overrides.cron || cron;
  const TaskModel = overrides.TaskModel || ScheduledTask;
  const runTask = overrides.runTask || taskRunService.runTask;
  const supportsTask = overrides.canExecuteTask || canExecuteTask;
  const jobs = new Map();

  function validateCron(expression) {
    return typeof expression === 'string' && cronLibrary.validate(expression);
  }

  function stopTask(taskKey) {
    const job = jobs.get(taskKey);
    if (!job) return;
    job.stop();
    if (typeof job.destroy === 'function') job.destroy();
    jobs.delete(taskKey);
  }

  function reportFailure(taskKey, err) {
    console.error('[定时任务] 自动执行失败', { taskKey, error: err.message });
  }

  function scheduleTask(task) {
    if (!supportsTask(task.task_key)) return false;
    stopTask(task.task_key);
    if (Number(task.enabled) !== 1) return false;
    if (!validateCron(task.cron_expression)) {
      throw new Error(`无效的 cron 表达式：${task.task_key}`);
    }
    const callback = () => runTask(task, 'auto').catch(err => reportFailure(task.task_key, err));
    const job = cronLibrary.schedule(task.cron_expression, callback, { timezone: 'Asia/Shanghai' });
    jobs.set(task.task_key, job);
    return true;
  }

  async function loadTasks() {
    const tasks = await TaskModel.findAll({ where: { del_flag: 0 }, order: [['id', 'ASC']] });
    for (const task of tasks) {
      try {
        scheduleTask(task);
      } catch (err) {
        reportFailure(task.task_key, err);
      }
    }
    return tasks;
  }

  return { loadTasks, scheduleTask, stopTask, validateCron };
}

module.exports = { ...createTaskScheduler(), createTaskScheduler };
