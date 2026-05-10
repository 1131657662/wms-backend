const sequelize = require('../config/database');

/**
 * 小程序微信绑定依赖 sys_user.openid；若库未跑 migrations/003_add_openid.sql，则在启动时自动补齐（MySQL）。
 */
async function ensureSysUserOpenidColumn() {
  if (sequelize.getDialect() !== 'mysql') return;

  try {
    const [rows] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_user' AND COLUMN_NAME = 'openid'`
    );
    const cnt = Number(rows[0]?.cnt ?? 0);
    if (cnt > 0) return;

    console.log('[迁移] 检测到 sys_user 缺少 openid 列，正在自动 ALTER TABLE ...');
    await sequelize.query(
      `ALTER TABLE sys_user ADD COLUMN openid VARCHAR(64) DEFAULT NULL COMMENT '微信openid'`
    );
    try {
      await sequelize.query('CREATE UNIQUE INDEX idx_openid ON sys_user (openid)');
    } catch (idxErr) {
      const m = String(idxErr.message || '');
      if (!m.includes('Duplicate') && idxErr.parent?.errno !== 1061) {
        throw idxErr;
      }
    }
    console.log('[迁移] sys_user.openid 已创建');
  } catch (e) {
    console.error(
      '[迁移] 无法自动创建 sys_user.openid，请用管理员账号手动执行 migrations/003_add_openid.sql:',
      e.message
    );
  }
}

module.exports = { ensureSysUserOpenidColumn };
