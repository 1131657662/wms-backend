'use strict';

const fsp = require('fs/promises');
const path = require('path');
const { getBackupConfig } = require('./backupConfig');
const { BackupError, asBackupError } = require('./backupError');
const fileStore = require('./backupFileStore');
const mysqlProcess = require('./mysqlProcess');

function logOperationFailure(operation, err) {
  console.error(`[数据库${operation}] 失败`, {
    code: err.code || 'UNEXPECTED_ERROR',
    diagnostic: err.diagnostic || err.message
  });
}

function normalizeOperationError(operation, err) {
  const message = operation === '备份' ? '数据库备份失败，请检查服务器日志' : '数据库恢复失败，请检查服务器日志';
  const normalized = asBackupError(err, message, `DATABASE_${operation === '备份' ? 'BACKUP' : 'RESTORE'}_FAILED`);
  logOperationFailure(operation, normalized);
  return normalized;
}

function createBackupService(overrides = {}) {
  const loadConfig = overrides.getBackupConfig || getBackupConfig;
  const dumpDatabase = overrides.dumpDatabase || mysqlProcess.dumpDatabase;
  const restoreDatabase = overrides.restoreDatabase || mysqlProcess.restoreDatabase;
  let activeOperation = null;

  async function runExclusive(operation, action) {
    if (activeOperation) {
      throw new BackupError(`数据库${activeOperation}正在执行，请稍后重试`, {
        code: 'DATABASE_OPERATION_BUSY',
        status: 409
      });
    }
    activeOperation = operation;
    try {
      return await action();
    } finally {
      activeOperation = null;
    }
  }

  async function cleanupAfterBackup(directory) {
    try {
      return { deleted: await fileStore.cleanupOldBackups(directory), cleanupWarning: null };
    } catch (err) {
      console.warn('[数据库备份] 旧备份清理失败', err.message);
      return { deleted: 0, cleanupWarning: '旧备份清理失败，请检查服务器日志' };
    }
  }

  async function createBackupArtifact() {
    const config = loadConfig();
    await fileStore.ensureBackupDirectory(config.directory);
    const filename = fileStore.buildBackupFilename();
    const filepath = fileStore.resolveBackupFile(config.directory, filename);
    const temporaryPath = path.join(config.directory, `.${filename}.${process.pid}.tmp`);
    try {
      await dumpDatabase({
        binary: config.dumpBinary,
        database: config.database,
        outputPath: temporaryPath,
        timeoutMs: config.timeoutMs
      });
      const stat = await fileStore.validateDumpFile(temporaryPath);
      await fsp.rename(temporaryPath, filepath);
      const cleanup = await cleanupAfterBackup(config.directory);
      return { filename, size: fileStore.formatSize(stat.size), bytes: stat.size, ...cleanup };
    } catch (err) {
      await fileStore.removeIfExists(temporaryPath);
      throw normalizeOperationError('备份', err);
    }
  }

  async function createBackup() {
    return runExclusive('备份', createBackupArtifact);
  }

  async function listBackups() {
    const config = loadConfig();
    return fileStore.listBackupFiles(config.directory);
  }

  async function getBackupFile(filename) {
    const config = loadConfig();
    const filepath = fileStore.resolveBackupFile(config.directory, filename);
    await fileStore.assertRegularFile(filepath);
    return { filename, filepath };
  }

  async function removeBackup(filename) {
    const { filepath } = await getBackupFile(filename);
    await fsp.unlink(filepath);
  }

  async function restoreBackupFile(filename) {
    return runExclusive('恢复', async () => {
      const config = loadConfig();
      if (config.allowWebRestore === false) {
        throw new BackupError('生产环境数据库恢复必须在维护窗口由运维人员执行', {
          code: 'WEB_RESTORE_DISABLED',
          status: 403
        });
      }
      const filepath = fileStore.resolveBackupFile(config.directory, filename);
      try {
        await fileStore.validateDumpFile(filepath);
        await restoreDatabase({
          binary: config.mysqlBinary,
          database: config.database,
          inputPath: filepath,
          timeoutMs: config.timeoutMs
        });
      } catch (err) {
        throw normalizeOperationError('恢复', err);
      }
    });
  }

  return { createBackup, getBackupFile, listBackups, removeBackup, restoreBackupFile };
}

module.exports = { ...createBackupService(), createBackupService };
