'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createTaskScheduler } = require('./taskScheduler');

function createCronDouble() {
  const calls = [];
  return {
    calls,
    validate: expression => expression === '*/5 * * * *',
    schedule: (expression, callback, options) => {
      const job = { expression, callback, options, stopped: false, stop() { this.stopped = true; } };
      calls.push(job);
      return job;
    }
  };
}

test('taskScheduler schedules enabled tasks with explicit timezone', () => {
  const cronDouble = createCronDouble();
  const scheduler = createTaskScheduler({
    cron: cronDouble,
    canExecuteTask: () => true,
    runTask: async () => ({ status: 'success' })
  });
  const task = { task_key: 'auto_backup', enabled: 1, cron_expression: '*/5 * * * *' };
  assert.equal(scheduler.scheduleTask(task), true);
  assert.equal(cronDouble.calls[0].options.timezone, 'Asia/Shanghai');
});

test('taskScheduler does not schedule disabled tasks', () => {
  const cronDouble = createCronDouble();
  const scheduler = createTaskScheduler({ cron: cronDouble, canExecuteTask: () => true });
  assert.equal(scheduler.scheduleTask({ task_key: 'auto_backup', enabled: 0, cron_expression: '*/5 * * * *' }), false);
  assert.equal(cronDouble.calls.length, 0);
});

test('taskScheduler stops an existing job before rescheduling', () => {
  const cronDouble = createCronDouble();
  const scheduler = createTaskScheduler({ cron: cronDouble, canExecuteTask: () => true });
  const task = { task_key: 'auto_backup', enabled: 1, cron_expression: '*/5 * * * *' };
  scheduler.scheduleTask(task);
  scheduler.scheduleTask(task);
  assert.equal(cronDouble.calls[0].stopped, true);
  assert.equal(cronDouble.calls.length, 2);
});

test('taskScheduler loads enabled task definitions from the database', async () => {
  const cronDouble = createCronDouble();
  const tasks = [
    { id: 1, task_key: 'auto_backup', enabled: 1, cron_expression: '*/5 * * * *' },
    { id: 2, task_key: 'log_cleanup', enabled: 0, cron_expression: '*/5 * * * *' }
  ];
  const scheduler = createTaskScheduler({
    cron: cronDouble,
    TaskModel: { async findAll() { return tasks; } },
    canExecuteTask: () => true
  });
  assert.deepEqual(await scheduler.loadTasks(), tasks);
  assert.equal(cronDouble.calls.length, 1);
});

test('taskScheduler rejects an invalid enabled cron expression', () => {
  const scheduler = createTaskScheduler({ cron: createCronDouble(), canExecuteTask: () => true });
  assert.throws(
    () => scheduler.scheduleTask({ task_key: 'auto_backup', enabled: 1, cron_expression: 'invalid' }),
    /无效的 cron 表达式/
  );
});
