'use strict';

const rateLimit = require('express-rate-limit');
const { HttpError } = require('../utils/httpError');

function rateLimitJsonHandler(req, res, next, options) {
  const m = options.message;
  const body =
    typeof m === 'object' && m !== null && !Array.isArray(m)
      ? m
      : { code: options.statusCode, message: String(m) };
  const status = options.statusCode;
  const code = body.code != null ? body.code : status;
  return next(new HttpError(status, body.message, { code }));
}

/** 登录接口：防暴力破解（按 IP） */
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.max(1, parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '30', 10)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
  message: { code: 429, message: '登录尝试过于频繁，请 15 分钟后再试' }
});

/** 报表类只读接口（含导出 URL）：按 IP 限流 */
exports.reportApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.max(1, parseInt(process.env.REPORT_RATE_LIMIT_MAX || '200', 10)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
  message: { code: 429, message: '报表接口请求过于频繁，请稍后再试' }
});

/** 各类 Excel/数据导出 GET：按 IP 限流（需登录后才会命中） */
exports.exportGetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.max(1, parseInt(process.env.EXPORT_RATE_LIMIT_MAX || '60', 10)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
  message: { code: 429, message: '导出请求过于频繁，请稍后再试' }
});

/** 积木打印 POST：按 IP 限流（放在 auth 前，避免未授权刷接口） */
exports.printPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.max(1, parseInt(process.env.PRINT_RATE_LIMIT_MAX || '40', 10)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
  message: { code: 429, message: '打印请求过于频繁，请稍后再试' }
});
