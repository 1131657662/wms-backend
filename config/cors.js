'use strict';

/**
 * 生产环境启动前校验：必须配置 CORS_ORIGIN，避免误用 `origin: true` 全开放。
 * 小程序、同源反代等无 Origin 的请求在回调里仍会放行（见 buildCorsOptions）。
 */
function assertProductionCorsOriginConfigured() {
  if (process.env.NODE_ENV !== 'production') return;
  const raw = process.env.CORS_ORIGIN;
  const list = raw
    ? raw.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  if (list.length === 0) {
    console.error(
      '[CORS] 生产环境必须在 .env 中设置 CORS_ORIGIN（逗号分隔多个前端源），例如：\n' +
        '  CORS_ORIGIN=https://wms.example.com,https://www.example.com\n' +
        '未设置时拒绝启动，以防止任意网站跨域调用您的 API。'
    );
    process.exit(1);
  }
}

/**
 * CORS：生产环境请在 .env 设置 CORS_ORIGIN（逗号分隔，如 https://wms.example.com,http://localhost:8848）
 */
function buildCorsOptions() {
  const raw = process.env.CORS_ORIGIN;
  const list = raw
    ? raw.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  if (list.length > 0) {
    return {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (list.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true
    };
  }
  return { origin: true, credentials: true };
}

module.exports = { buildCorsOptions, assertProductionCorsOriginConfigured };
