'use strict';

const assert = require('node:assert/strict');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const fileStore = require('./backupFileStore');

async function createTempDirectory(t) {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'wms-backup-test-'));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  return directory;
}

function validDump() {
  return [
    '-- MySQL dump 10.13  Distrib 8.0.45',
    'CREATE TABLE `sample` (`id` int NOT NULL);',
    'INSERT INTO `sample` VALUES (1);',
    '-- Dump completed on 2026-08-08 12:00:00'
  ].join('\n');
}

test('resolveBackupFile accepts legacy and current backup names', () => {
  const directory = path.resolve('backups');
  const legacy = 'wms_backup_2026-05-01T02-30-00.sql';
  const current = 'wms_backup_2026-08-08T12-00-00-123-a1b2c3d4.sql';
  assert.equal(fileStore.resolveBackupFile(directory, legacy), path.join(directory, legacy));
  assert.equal(fileStore.resolveBackupFile(directory, current), path.join(directory, current));
});

test('resolveBackupFile rejects directory traversal', () => {
  assert.throws(
    () => fileStore.resolveBackupFile(path.resolve('backups'), '../.env'),
    err => err.code === 'BACKUP_FILE_INVALID' && err.status === 400
  );
});

test('assertRegularFile reports a missing backup as not found', async t => {
  const directory = await createTempDirectory(t);
  await assert.rejects(
    fileStore.assertRegularFile(path.join(directory, 'missing.sql')),
    err => err.code === 'BACKUP_FILE_NOT_FOUND' && err.status === 404
  );
});

test('validateDumpFile accepts a completed mysqldump artifact', async t => {
  const directory = await createTempDirectory(t);
  const filepath = path.join(directory, 'valid.sql');
  await fsp.writeFile(filepath, validDump());
  const stat = await fileStore.validateDumpFile(filepath);
  assert.ok(stat.size >= 100);
});

test('validateDumpFile rejects a partial dump', async t => {
  const directory = await createTempDirectory(t);
  const filepath = path.join(directory, 'partial.sql');
  await fsp.writeFile(filepath, `${validDump().slice(0, -40)}partial`);
  await assert.rejects(
    fileStore.validateDumpFile(filepath),
    err => err.code === 'BACKUP_FILE_INVALID'
  );
});
