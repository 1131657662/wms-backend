'use strict';

const Sequelize = require('sequelize');

/**
 * 可携带 HTTP 状态码的业务 / 路由错误，供 `asyncHandler` + 全局错误中间件使用。
 * @param {number} status HTTP 状态码
 * @param {string} message 响应 message
 * @param {{ code?: number, expose?: boolean }} [options]
 *        expose: 生产环境下 5xx 是否仍把 message 返回给客户端（默认 false，仅日志保留详情）
 */
class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = options.code != null ? options.code : status;
    this.expose =
      options.expose !== undefined ? options.expose : status < 500;
    Error.captureStackTrace?.(this, HttpError);
  }
}

function sequelizeClientMessage(err) {
  if (err instanceof Sequelize.UniqueConstraintError) {
    return '数据重复，请检查唯一字段';
  }
  if (err instanceof Sequelize.ValidationError) {
    const parts = err.errors.map(e => e.message).filter(Boolean);
    return parts.length ? parts.join('; ') : '数据校验失败';
  }
  if (err instanceof Sequelize.ForeignKeyConstraintError) {
    return '关联数据不存在或已被引用';
  }
  if (err instanceof Sequelize.TimeoutError) {
    return '数据库请求超时';
  }
  return null;
}

/**
 * 将任意路由错误映射为统一 JSON 字段（供 sendError 使用）。
 * @param {unknown} err
 * @param {{ isProduction: boolean }} ctx
 * @returns {{ httpStatus: number, bodyCode: number, message: string }}
 */
function normalizeApiError(err, ctx) {
  const { isProduction } = ctx;
  const fallback500 = '服务器内部错误';

  if (err instanceof HttpError) {
    let message = err.message || fallback500;
    if (isProduction && err.status >= 500 && !err.expose) {
      message = fallback500;
    }
    return { httpStatus: err.status, bodyCode: err.code, message };
  }

  const status =
    err && typeof err.status === 'number'
      ? err.status
      : err && typeof err.statusCode === 'number'
        ? err.statusCode
        : null;
  if (status && status >= 400 && status < 500) {
    return {
      httpStatus: status,
      bodyCode: status,
      message: (err && err.message) || '请求无效'
    };
  }

  const sqMsg = err instanceof Error ? sequelizeClientMessage(err) : null;
  if (sqMsg) {
    const httpStatus =
      err instanceof Sequelize.UniqueConstraintError
        ? 409
        : err instanceof Sequelize.TimeoutError
          ? 504
          : 400;
    return { httpStatus, bodyCode: httpStatus, message: sqMsg };
  }

  if (isProduction) {
    return { httpStatus: 500, bodyCode: 500, message: fallback500 };
  }
  return {
    httpStatus: 500,
    bodyCode: 500,
    message: (err && err.message) || fallback500
  };
}

/** 在控制器 catch 块开头调用：把业务性 HttpError 交回全局错误中间件 */
function rethrowIfHttpError(err) {
  if (err instanceof HttpError) throw err;
}

/**
 * HttpError 与 Sequelize 客户端可识别错误（校验/唯一/外键/超时）交回全局，与 normalizeApiError 一致。
 * 若 catch 中另有对 SequelizeUniqueConstraintError 的自定义映射，请先 `rethrowIfHttpError(err)`，
 * 再执行自定义分支，最后调用本函数。
 */
function rethrowIfHttpErrorOrSequelize(err) {
  rethrowIfHttpError(err);
  if (sequelizeClientMessage(err)) throw err;
}

module.exports = {
  HttpError,
  normalizeApiError,
  rethrowIfHttpError,
  rethrowIfHttpErrorOrSequelize
};
