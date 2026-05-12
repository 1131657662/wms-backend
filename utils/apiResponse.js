'use strict';

/**
 * 统一 JSON 成功响应（新代码优先使用，旧接口逐步迁移）
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {string} [message='success']
 */
function sendSuccess(res, data, message = 'success') {
  return res.json({ code: 200, message, data });
}

/**
 * @param {import('express').Response} res
 * @param {number} httpStatus
 * @param {string} message
 * @param {number} [code]
 */
function sendError(res, httpStatus, message, code) {
  const c = code != null ? code : httpStatus;
  return res.status(httpStatus).json({ code: c, message });
}

module.exports = { sendSuccess, sendError };
