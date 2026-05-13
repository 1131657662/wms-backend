'use strict';

const UserLoginLog = require('../models/user_login_log');
const { parseUserAgent } = require('../utils/parseUserAgent');
const { LOGIN_LOG_EVENT } = require('../constants/audit');

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

module.exports = { writeUserLoginLog, LOGIN_LOG_EVENT };
