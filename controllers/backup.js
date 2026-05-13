const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function findMySQLBin(name) {
  const winExe = process.platform === 'win32' ? '.exe' : '';
  const candidates = [
    // Windows
    `C:/Program Files/MySQL/MySQL Server 8.0/bin/${name}${winExe}`,
    `C:/Program Files/MySQL/MySQL Server 8.4/bin/${name}${winExe}`,
    `D:/Program Files/MySQL/MySQL Server 8.0/bin/${name}${winExe}`,
    `C:/Program Files (x86)/MySQL/MySQL Server 8.0/bin/${name}${winExe}`,
    // Linux / macOS
    `/usr/bin/${name}`,
    `/usr/local/mysql/bin/${name}`,
    `/opt/mysql/bin/${name}`
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return `"${c}"`;
  }
  return name;
}

const MYSQLDUMP = findMySQLBin('mysqldump');
const MYSQL = findMySQLBin('mysql');

function getDBConfig() {
  const env = require('dotenv').config().parsed || process.env;
  return {
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT || '3306',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'wms'
  };
}

// 从文件名解析时间
function parseBackupTime(filename) {
  // wms_backup_2026-05-01T02-30-00.sql
  const match = filename.match(/(\d{4}-\d{2}-\d{2})T(\d{2}-\d{2}-\d{2})/);
  if (!match) return null;
  return new Date(match[1] + 'T' + match[2].replace(/-/g, ':') + 'Z');
}

// 核心备份逻辑
function performBackup() {
  const db = getDBConfig();
  const ts = new Date();
  const dateStr = ts.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `wms_backup_${dateStr}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const cmd = `${MYSQLDUMP} -h${db.host} -P${db.port} -u${db.user} -p"${db.password}" --single-transaction --routines --triggers --default-character-set=utf8mb4 ${db.database}`;
  const output = execSync(cmd, { timeout: 60000, encoding: 'utf8' });
  fs.writeFileSync(filepath, output, 'utf8');

  const stat = fs.statSync(filepath);
  console.log(`[自动备份] 完成: ${filename} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  return { filename, size: (stat.size / 1024 / 1024).toFixed(2) + ' MB' };
}

// 保留策略：最近7天每天保留，8～30天内每周保留一份（周一），超过30天删除
function cleanupOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => ({ filename: f, time: parseBackupTime(f) }))
    .filter(f => f.time)
    .sort((a, b) => b.time - a.time);

  const now = new Date();
  const DAY = 86400000;
  const keep = new Set();

  // 分组：按天和按周
  const daily = new Map();  // dayKey -> files
  const weekly = new Map(); // weekKey -> files

  for (const f of files) {
    const age = now - f.time;
    const d = f.time;
    const dayKey = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    // ISO 周年+周数
    const weekKey = getWeekKey(d);

    if (age <= 7 * DAY) {
      // 7天内：每天保留最新一份
      if (!daily.has(dayKey)) daily.set(dayKey, f);
    } else if (age <= 30 * DAY) {
      // 8～30天：每周保留一份
      if (!weekly.has(weekKey)) weekly.set(weekKey, f);
    }
    // 超过 30 天不保留
  }

  for (const f of daily.values()) keep.add(f.filename);
  for (const f of weekly.values()) keep.add(f.filename);

  let deleted = 0;
  for (const f of files) {
    if (!keep.has(f.filename)) {
      fs.unlinkSync(path.join(BACKUP_DIR, f.filename));
      deleted++;
    }
  }
  if (deleted > 0) console.log(`[备份清理] 删除 ${deleted} 个过期备份`);
  return deleted;
}

function getWeekKey(d) {
  // 周一作为一周的开始
  const day = d.getDay() || 7; // 周日=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  return monday.getFullYear() + '-W' + Math.ceil((monday.getDate() + ((new Date(monday.getFullYear(), monday.getMonth(), 1).getDay() || 7) - 1)) / 7) + '-' + (monday.getMonth() + 1);
}

// 手动备份
exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');
    const result = performBackup();
    cleanupOldBackups();
    return sendSuccess(res, result, '备份成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('数据库备份失败:', err.message);
    throw new HttpError(500, '备份失败，请检查数据库配置与 mysqldump 是否可用', { expose: true });
  }
};

// 自动备份（供 cron 调用）
exports.autoBackup = async () => {
  try {
    performBackup();
    cleanupOldBackups();
  } catch (err) {
    console.error('[自动备份] 失败:', err.message);
  }
};

// 备份文件列表
exports.list = async (req, res) => {
  try {
    const now = new Date();
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        const t = parseBackupTime(f);
        const ageDays = t ? Math.round((now - t) / 86400000) : null;
        let tag = '';
        if (ageDays !== null) {
          if (ageDays <= 7) tag = '日备份';
          else if (ageDays <= 30) tag = '周备份';
          else tag = '待清理';
        }
        return { filename: f, size: (stat.size / 1024 / 1024).toFixed(2) + ' MB', createTime: stat.birthtime, tag };
      })
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    return sendSuccess(res, { list: files, total: files.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 下载备份文件
exports.download = async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) throw new HttpError(404, '文件不存在');
    res.download(filepath, filename);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// 恢复备份
exports.restore = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');
    const { filename } = req.body;
    if (!filename) throw new HttpError(400, '请指定备份文件');
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) throw new HttpError(404, '备份文件不存在');
    const db = getDBConfig();
    const cmd = `${MYSQL} -h${db.host} -P${db.port} -u${db.user} -p"${db.password}" --default-character-set=utf8mb4 ${db.database}`;
    const sql = fs.readFileSync(filepath, 'utf8');
    execSync(cmd, { input: sql, timeout: 60000 });
    return sendSuccess(res, null, '数据恢复成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('数据恢复失败:', err.message);
    throw new HttpError(500, '恢复失败，请检查备份文件与数据库连接', { expose: true });
  }
};

// 删除备份
exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) throw new HttpError(404, '文件不存在');
    fs.unlinkSync(filepath);
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};
