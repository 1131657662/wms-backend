'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createScheduledTaskRunService
} = require('./scheduledTaskRunService');
const { ScheduledTaskExecutionError } = require('./scheduledTaskExecutionService');

function createLogModel(logs) {
  return {
    async create(data) {
      const log = {
        ...data,
        async update(update) { Object.assign(this, update); logs.push({ ...update }); }
      };
      logs.push({ ...data });
      return log;
    }
  };
}

test('scheduledTaskRunService records success and last run time', async () => {
  const logs = [];
  const updates = [];
  const service = createScheduledTaskRunService({
    LogModel: createLogModel(logs),
    TaskModel: { async update(data, options) { updates.push({ data, options }); } },
    executeTask: async () => '备份成功：sample.sql'
  });
  const result = await service.runTask({ id: 1, task_key: 'auto_backup', task_name: '数据库自动备份' }, 'manual');
  assert.equal(result.status, 'success');
  assert.equal(result.message, '备份成功：sample.sql');
  assert.equal(logs.at(-1).status, 'success');
  assert.equal(updates.length, 1);
});

test('scheduledTaskRunService records failure without updating last run time', async () => {
  const logs = [];
  const updates = [];
  const service = createScheduledTaskRunService({
    LogModel: createLogModel(logs),
    TaskModel: { async update(data, options) { updates.push({ data, options }); } },
    executeTask: async () => {
      throw new ScheduledTaskExecutionError('任务执行失败，请检查服务器日志', 500);
    }
  });
  await assert.rejects(
    service.runTask({ id: 1, task_key: 'auto_backup', task_name: '数据库自动备份' }, 'auto'),
    err => err.message === '任务执行失败，请检查服务器日志'
  );
  assert.equal(logs.at(-1).status, 'failed');
  assert.equal(updates.length, 0);
});
