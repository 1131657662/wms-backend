const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { HttpError } = require('../utils/httpError');
require('dotenv').config();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new HttpError(401, '未登录或 token 无效'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 检查 token 是否在黑名单中
    const SysTokenBlacklist = require('../models/sys_token_blacklist');
    const blacklisted = await SysTokenBlacklist.findOne({ where: { token_hash: hashToken(token) } });
    if (blacklisted) {
      return next(new HttpError(401, '您已被强制下线，请重新登录'));
    }
    req.user = decoded;
    next();
  } catch {
    return next(new HttpError(401, 'token 已过期，请重新登录'));
  }
};
