function requireAdmin(req, res, next) {
  if (req.user.roleCode !== 'ADMIN') {
    return res.status(403).json({ code: 403, message: '无权限，仅管理员可操作' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.roleCode)) {
      return res.status(403).json({ code: 403, message: '无权限' });
    }
    next();
  };
}

function hasPermission(permCode) {
  return (req, res, next) => {
    if (req.user.roleCode === 'ADMIN') return next();
    if (req.user.permissions && req.user.permissions.includes(permCode)) {
      return next();
    }
    return res.status(403).json({ code: 403, message: `无权限：${permCode}` });
  };
}

module.exports = { requireAdmin, requireRole, hasPermission };

