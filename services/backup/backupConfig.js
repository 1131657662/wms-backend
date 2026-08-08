'use strict';

const fs = require('fs');
const path = require('path');
const { BackupError } = require('./backupError');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_BACKUP_DIR = path.join(PROJECT_ROOT, 'backups');
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function requireValue(env, key) {
  const value = String(env[key] || '').trim();
  if (value) return value;
  throw new BackupError(`数据库备份配置缺少 ${key}`, {
    code: 'BACKUP_CONFIG_INVALID'
  });
}

function validatePort(value) {
  const port = Number(value);
  if (Number.isInteger(port) && port > 0 && port <= 65535) return String(port);
  throw new BackupError('数据库端口配置无效', { code: 'BACKUP_CONFIG_INVALID' });
}

function validateDatabaseName(value) {
  if (/^[A-Za-z0-9_]+$/.test(value)) return value;
  throw new BackupError('数据库名称配置无效', { code: 'BACKUP_CONFIG_INVALID' });
}

function getDatabaseConfig(env = process.env) {
  return {
    host: requireValue(env, 'DB_HOST'),
    port: validatePort(requireValue(env, 'DB_PORT')),
    user: requireValue(env, 'DB_USER'),
    password: requireValue(env, 'DB_PASSWORD'),
    database: validateDatabaseName(requireValue(env, 'DB_NAME'))
  };
}

function findBinary(name, configuredPath) {
  if (configuredPath) return configuredPath;
  const extension = process.platform === 'win32' ? '.exe' : '';
  const candidates = [
    `C:/Program Files/MySQL/MySQL Server 8.0/bin/${name}${extension}`,
    `C:/Program Files/MySQL/MySQL Server 8.4/bin/${name}${extension}`,
    `D:/Program Files/MySQL/MySQL Server 8.0/bin/${name}${extension}`,
    `C:/Program Files (x86)/MySQL/MySQL Server 8.0/bin/${name}${extension}`,
    `/usr/bin/${name}`,
    `/usr/local/mysql/bin/${name}`,
    `/opt/mysql/bin/${name}`
  ];
  return candidates.find(candidate => fs.existsSync(candidate)) || name;
}

function getTimeoutMs(env = process.env) {
  const value = Number(env.WMS_BACKUP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (Number.isInteger(value) && value >= 1000 && value <= 60 * 60 * 1000) return value;
  throw new BackupError('备份超时时间配置无效', { code: 'BACKUP_CONFIG_INVALID' });
}

function getBackupConfig(env = process.env) {
  return {
    directory: path.resolve(env.WMS_BACKUP_DIR || DEFAULT_BACKUP_DIR),
    dumpBinary: findBinary('mysqldump', env.MYSQLDUMP_BIN),
    mysqlBinary: findBinary('mysql', env.MYSQL_BIN),
    timeoutMs: getTimeoutMs(env),
    allowWebRestore: env.NODE_ENV !== 'production' || env.WMS_ALLOW_WEB_RESTORE === 'true',
    database: getDatabaseConfig(env)
  };
}

module.exports = { getBackupConfig };
