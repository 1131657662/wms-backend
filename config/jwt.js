'use strict';

/**
 * 生产环境启动前校验 JWT_SECRET，避免弱密钥或未配置。
 */
function assertProductionJwtSecret() {
  if (process.env.NODE_ENV !== 'production') return;
  const s = process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim();
  if (!s || s.length < 16) {
    console.error(
      '[JWT] 生产环境必须在 .env 中设置 JWT_SECRET，且长度不少于 16 字符。\n' +
        '请勿将 .env 提交到版本库；云端用环境变量或密钥管理注入。'
    );
    process.exit(1);
  }
}

module.exports = { assertProductionJwtSecret };
