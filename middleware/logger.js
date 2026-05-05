const crypto = require('crypto');
const logService = require('../services/logService');

const moduleMap = {
  '/api/login': '登录',
  '/api/inbound': '入库管理',
  '/api/outbound': '出库管理',
  '/api/stock': '库存管理',
  '/api/warehouse': '基础资料',
  '/api/product': '基础资料',
  '/api/supplier': '基础资料',
  '/api/customer': '基础资料',
  '/api/vehicle': '基础资料',
  '/api/sys/user': '系统管理',
  '/api/sys/role': '系统管理',
  '/api/sys/log': '系统管理',
  '/api/sys/dict': '系统管理',
  '/api/sys/bill-config': '系统管理',
  '/api/sys/config': '系统管理',
  '/api/sys/scheduled-task': '系统管理',
  '/api/sys/online': '系统管理',
  '/api/backup': '系统管理',
  '/api/print': '系统管理',
  '/api/dashboard': '系统管理',
  '/api/message': '系统管理',
  '/api/report': '系统管理',
  '/api/health': '系统管理',
  '/api/system/menu': '系统管理',
  '/api/user': '个人中心'
};

function getModule(path) {
  for (const [prefix, name] of Object.entries(moduleMap)) {
    if (path.startsWith(prefix)) return name;
  }
  return '其他';
}

function getOperationDesc(path, method) {
  const segments = path.split('/').filter(Boolean);
  const resource = segments[segments.length - 1] || '';
  if (path === '/api/login') return '用户登录';
  if (path.startsWith('/api/sys/dict/data/')) return '获取字典数据';
  if (resource === 'search') return '远程搜索';
  if (resource === 'export') return '导出数据';
  return null;
}

function sanitizeParams(obj) {
  if (!obj) return '';
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    if (copy.password) copy.password = '***';
    if (copy.oldPassword) copy.oldPassword = '***';
    if (copy.newPassword) copy.newPassword = '***';
    const str = JSON.stringify(copy);
    return str.length > 2000 ? str.substring(0, 2000) : str;
  } catch {
    return '';
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const costTime = Date.now() - startTime;
    const params = sanitizeParams({ ...req.query, ...req.body });
    const status = res.statusCode < 400 ? 1 : 0;
    const module = getModule(req.path);

    logService.log({
      userId: req.user?.id || null,
      username: req.user?.username || 'anonymous',
      module,
      operation: `${req.method} ${req.path}`,
      operationDesc: getOperationDesc(req.path, req.method),
      requestUrl: req.originalUrl,
      method: req.method,
      params,
      ip: req.ip || req.connection?.remoteAddress || '',
      costTime,
      status,
      errorMsg: status === 0 ? `HTTP ${res.statusCode}` : null
    });

    // 更新在线用户活跃时间（仅已认证用户）
    if (req.user?.id) {
      const SysOnlineUser = require('../models/sys_online_user');
      const existing = await SysOnlineUser.findOne({ where: { user_id: req.user.id } }).catch(() => null);
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const upsertData = {
        user_id: req.user.id,
        username: req.user.username,
        nickname: req.user.nickname || '',
        ip: req.ip || req.connection?.remoteAddress || '',
        last_active_time: new Date(),
        login_time: existing?.login_time || new Date()
      };
      if (token) upsertData.token_hash = hashToken(token);
      SysOnlineUser.upsert(upsertData, { conflictFields: ['user_id'] }).catch(() => {});
    }
  });

  next();
};
