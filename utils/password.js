const bcrypt = require('bcryptjs');

/** 校验密码；哈希缺失或格式异常时不抛错，视为不匹配 */
function verifyPassword(plain, hashed) {
  if (plain == null || hashed == null) return false;
  const h = typeof hashed === 'string' ? hashed : String(hashed);
  const p = typeof plain === 'string' ? plain : String(plain);
  if (!h || !p) return false;
  try {
    return bcrypt.compareSync(p, h);
  } catch {
    return false;
  }
}

module.exports = { verifyPassword };
