'use strict';

const crypto = require('crypto');
const fsp = require('fs/promises');
const path = require('path');
const { BackupError } = require('./backupError');

const BACKUP_NAME_PATTERN = /^wms_backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:-\d{3}-[a-f0-9]{8})?\.sql$/;
const DAY_MS = 24 * 60 * 60 * 1000;

async function ensureBackupDirectory(directory) {
  await fsp.mkdir(directory, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') await fsp.chmod(directory, 0o700);
}

function buildBackupFilename(now = new Date()) {
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 23);
  const suffix = crypto.randomBytes(4).toString('hex');
  return `wms_backup_${timestamp}-${suffix}.sql`;
}

function parseBackupTime(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})T(\d{2}-\d{2}-\d{2})(?:-(\d{3})-[a-f0-9]{8})?/);
  if (!match) return null;
  const milliseconds = match[3] || '000';
  return new Date(`${match[1]}T${match[2].replace(/-/g, ':')}.${milliseconds}Z`);
}

function resolveBackupFile(directory, filename) {
  if (!BACKUP_NAME_PATTERN.test(String(filename || ''))) {
    throw new BackupError('备份文件名无效', { code: 'BACKUP_FILE_INVALID', status: 400 });
  }
  const root = path.resolve(directory);
  const resolved = path.resolve(root, filename);
  if (path.dirname(resolved) !== root) {
    throw new BackupError('备份文件路径无效', { code: 'BACKUP_FILE_INVALID', status: 400 });
  }
  return resolved;
}

async function readSection(handle, length, position) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  return buffer.subarray(0, bytesRead).toString('utf8');
}

async function validateDumpFile(filepath) {
  const stat = await assertRegularFile(filepath);
  if (!stat.isFile() || stat.size < 100) {
    throw new BackupError('备份文件为空或不完整', { code: 'BACKUP_FILE_INVALID' });
  }
  const handle = await fsp.open(filepath, 'r');
  try {
    const head = await readSection(handle, Math.min(stat.size, 65536), 0);
    const tailStart = Math.max(0, stat.size - 65536);
    const tail = await readSection(handle, stat.size - tailStart, tailStart);
    if (!head.includes('MySQL dump') || !tail.includes('Dump completed on')) {
      throw new BackupError('备份文件缺少完整性标记', { code: 'BACKUP_FILE_INVALID' });
    }
  } finally {
    await handle.close();
  }
  return stat;
}

async function assertRegularFile(filepath) {
  let stat;
  try {
    stat = await fsp.lstat(filepath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new BackupError('备份文件不存在', { code: 'BACKUP_FILE_NOT_FOUND', status: 404 });
    }
    throw err;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new BackupError('备份文件无效', { code: 'BACKUP_FILE_INVALID', status: 400 });
  }
  return stat;
}

function getWeekKey(date) {
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
}

function getDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function selectRetainedFiles(files, now = new Date()) {
  const daily = new Map();
  const weekly = new Map();
  for (const file of files) {
    const age = now - file.time;
    const dayKey = getDayKey(file.time);
    if (age <= 7 * DAY_MS && !daily.has(dayKey)) daily.set(dayKey, file.filename);
    if (age > 7 * DAY_MS && age <= 30 * DAY_MS && !weekly.has(getWeekKey(file.time))) {
      weekly.set(getWeekKey(file.time), file.filename);
    }
  }
  return new Set([...daily.values(), ...weekly.values()]);
}

async function getBackupEntries(directory) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  return entries.filter(entry => entry.isFile() && BACKUP_NAME_PATTERN.test(entry.name));
}

async function listBackupFiles(directory) {
  await ensureBackupDirectory(directory);
  const entries = await getBackupEntries(directory);
  const files = await Promise.all(entries.map(async entry => {
    const filepath = resolveBackupFile(directory, entry.name);
    const stat = await fsp.stat(filepath);
    const time = parseBackupTime(entry.name) || stat.mtime;
    const ageDays = Math.round((Date.now() - time.getTime()) / DAY_MS);
    const tag = ageDays <= 7 ? '日备份' : ageDays <= 30 ? '周备份' : '待清理';
    return { filename: entry.name, size: formatSize(stat.size), createTime: time, tag };
  }));
  return files.sort((left, right) => right.createTime - left.createTime);
}

async function cleanupOldBackups(directory, now = new Date()) {
  const entries = await getBackupEntries(directory);
  const files = entries.map(entry => ({ filename: entry.name, time: parseBackupTime(entry.name) }))
    .filter(file => file.time)
    .sort((left, right) => right.time - left.time);
  const keep = selectRetainedFiles(files, now);
  const obsolete = files.filter(file => !keep.has(file.filename));
  await Promise.all(obsolete.map(file => fsp.unlink(resolveBackupFile(directory, file.filename))));
  return obsolete.length;
}

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function removeIfExists(filepath) {
  await fsp.rm(filepath, { force: true });
}

module.exports = {
  assertRegularFile,
  buildBackupFilename,
  cleanupOldBackups,
  ensureBackupDirectory,
  formatSize,
  listBackupFiles,
  removeIfExists,
  resolveBackupFile,
  validateDumpFile
};
