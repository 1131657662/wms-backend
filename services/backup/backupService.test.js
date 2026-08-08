'use strict';

const assert = require('node:assert/strict');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createBackupService } = require('./backupService');

function validDump() {
  return [
    '-- MySQL dump 10.13  Distrib 8.0.45',
    'CREATE TABLE `sample` (`id` int NOT NULL);',
    'INSERT INTO `sample` VALUES (1);',
    '-- Dump completed on 2026-08-08 12:00:00'
  ].join('\n');
}

async function createFixture(t, dumpDatabase) {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'wms-service-test-'));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  const config = {
    directory,
    dumpBinary: 'mysqldump',
    mysqlBinary: 'mysql',
    timeoutMs: 10000,
    database: { host: 'localhost', port: '3306', user: 'wms', password: 'secret', database: 'wms' }
  };
  return { directory, service: createBackupService({ getBackupConfig: () => config, dumpDatabase }) };
}

test('createBackup publishes a validated final file', async t => {
  const fixture = await createFixture(t, async options => fsp.writeFile(options.outputPath, validDump()));
  const result = await fixture.service.createBackup();
  const finalPath = path.join(fixture.directory, result.filename);
  assert.equal((await fsp.readFile(finalPath, 'utf8')), validDump());
  assert.equal(result.cleanupWarning, null);
});

test('createBackup removes partial output after dump failure', async t => {
  const fixture = await createFixture(t, async options => {
    await fsp.writeFile(options.outputPath, 'partial output');
    throw new Error('simulated dump failure');
  });
  await assert.rejects(
    fixture.service.createBackup(),
    err => err.code === 'DATABASE_BACKUP_FAILED' && !err.message.includes('simulated')
  );
  assert.deepEqual(await fsp.readdir(fixture.directory), []);
});

test('createBackup rejects concurrent database operations', async t => {
  let releaseDump;
  let markStarted;
  const started = new Promise(resolve => { markStarted = resolve; });
  const fixture = await createFixture(t, async options => {
    markStarted();
    await new Promise(resolve => { releaseDump = resolve; });
    await fsp.writeFile(options.outputPath, validDump());
  });
  const first = fixture.service.createBackup();
  await started;
  await assert.rejects(fixture.service.createBackup(), err => err.code === 'DATABASE_OPERATION_BUSY');
  releaseDump();
  await first;
});

test('restoreBackupFile is disabled by production configuration', async t => {
  const fixture = await createFixture(t, async () => {});
  const service = createBackupService({
    getBackupConfig: () => ({
      directory: fixture.directory,
      allowWebRestore: false
    })
  });
  await assert.rejects(
    service.restoreBackupFile('wms_backup_2026-08-08T12-00-00.sql'),
    err => err.code === 'WEB_RESTORE_DISABLED' && err.status === 403
  );
});
