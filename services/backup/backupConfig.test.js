'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getBackupConfig } = require('./backupConfig');

function createEnvironment(overrides = {}) {
  return {
    DB_HOST: '127.0.0.1',
    DB_PORT: '3306',
    DB_USER: 'wms',
    DB_PASSWORD: 'secret',
    DB_NAME: 'wms',
    ...overrides
  };
}

test('getBackupConfig disables web restore by default in production', () => {
  const config = getBackupConfig(createEnvironment({ NODE_ENV: 'production' }));
  assert.equal(config.allowWebRestore, false);
});

test('getBackupConfig requires explicit production restore opt in', () => {
  const config = getBackupConfig(createEnvironment({
    NODE_ENV: 'production',
    WMS_ALLOW_WEB_RESTORE: 'true'
  }));
  assert.equal(config.allowWebRestore, true);
});

test('getBackupConfig validates the database name', () => {
  assert.throws(
    () => getBackupConfig(createEnvironment({ DB_NAME: '--defaults-file=evil' })),
    err => err.code === 'BACKUP_CONFIG_INVALID'
  );
});
