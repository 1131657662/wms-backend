'use strict';

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
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[CORS] 未设置 CORS_ORIGIN，当前允许任意来源（不安全）。请在 .env 中设置，例如：CORS_ORIGIN=https://你的前端域名'
    );
  }
  return { origin: true, credentials: true };
}

module.exports = { buildCorsOptions };
