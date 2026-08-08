'use strict';

const ScheduledTask = require('../models/scheduled_task');
const ScheduledTaskLog = require('../models/scheduled_task_log');
const {
  executeTask,
  ScheduledTaskExecutionError
} = require('./scheduledTaskExecutionService');

function normalizeExecutionError(err) {
  if (err instanceof ScheduledTaskExecutionError) return err;
  console.error('[定时任务] 执行编排失败', err);
  return new ScheduledTaskExecutionError('任务执行失败，请检查服务器日志', 500);
}

function createScheduledTaskRunService(overrides = {}) {
  const TaskModel = overrides.TaskModel || ScheduledTask;
  const LogModel = overrides.LogModel || ScheduledTaskLog;
  const execute = overrides.executeTask || executeTask;

  async function createLog(task, triggerType, startTime) {
    return LogModel.create({
      task_key: task.task_key,
      task_name: task.task_name,
      trigger_type: triggerType,
      status: 'running',
      start_time: startTime
    });
  }

  async function finishLog(logEntry, startTime, status, message) {
    const endTime = new Date();
    await logEntry.update({
      status,
      result_message: message,
      end_time: endTime,
      duration_ms: endTime - startTime
    });
    return endTime - startTime;
  }

  async function recordSuccess(task, logEntry, startTime, message) {
    const duration = await finishLog(logEntry, startTime, 'success', message);
    await TaskModel.update(
      { last_run_time: new Date(), update_time: new Date() },
      { where: { id: task.id } }
    );
    return { status: 'success', duration_ms: duration, message };
  }

  async function runTask(task, triggerType) {
    const startTime = new Date();
    const logEntry = await createLog(task, triggerType, startTime);
    try {
      const message = await execute(task.task_key);
      return await recordSuccess(task, logEntry, startTime, message);
    } catch (err) {
      const normalized = normalizeExecutionError(err);
      await finishLog(logEntry, startTime, 'failed', normalized.message);
      throw normalized;
    }
  }

  return { runTask };
}

module.exports = { ...createScheduledTaskRunService(), createScheduledTaskRunService };
