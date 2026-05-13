'use strict';

const UserLoginLog = require('../models/user_login_log');
const SysConfig = require('../models/sys_config');
const { Op } = require('sequelize');
const { parseUserAgent } = require('../utils/parseUserAgent');
const { LOGIN_LOG_EVENT } = require('../constants/audit');

/**
 * 与操作日志共用「日志保留天数」；定时任务与手动清理均可调用。
 */
async function cleanExpiredLoginLogs() {
  const cfg = await SysConfig.findOne({ where: { config_key: 'log_retention_days' } });
  const days = parseInt((cfg && cfg.config_value) || 90, 10);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
  const deleted = await UserLoginLog.destroy({ where: { createTime: { [Op.lt]: cutoff } } });
  console.log(`[登录安全日志清理] 删除 ${deleted} 条 ${days} 天前的 user_login_log（截止 ${cutoff}）`);
  return { deleted, days, cutoff };
}

/**
 * 写入 user_login_log（登录、改密、资料、头像等安全相关事件）
 */
async function writeUserLoginLog({
  userId,
  username,
  req,
  status,
  failReason,
  eventType = LOGIN_LOG_EVENT.LOGIN
}) {
  try {
    const ua = req.get('user-agent') || '';
    const { os, browser } = parseUserAgent(ua);
    await UserLoginLog.create({
      userId: userId ?? null,
      username: username || '',
      ip: (req.ip || req.connection?.remoteAddress || '').slice(0, 64),
      userAgent: ua.slice(0, 500),
      osName: os.slice(0, 80),
      browserName: browser.slice(0, 80),
      status,
      failReason: failReason ? String(failReason).slice(0, 200) : null,
      eventType
    });
  } catch (e) {
    console.error('user_login_log 写入失败:', e.message);
  }
}

module.exports = { writeUserLoginLog, cleanExpiredLoginLogs };
