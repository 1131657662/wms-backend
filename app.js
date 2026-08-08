const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  buildCorsOptions,
  assertProductionCorsOriginConfigured
} = require('./config/cors');
const { assertProductionJwtSecret } = require('./config/jwt');
assertProductionCorsOriginConfigured();
assertProductionJwtSecret();
const { reportApiLimiter } = require('./middleware/rateLimit');

const sequelize = require('./config/database');
const { ensureSysUserOpenidColumn } = require('./utils/ensureSysUserOpenid');
const authRoutes = require('./routes/auth');
const productCategoryRoutes = require('./routes/product_category');
const productRoutes = require('./routes/product');
const warehouseRoutes = require('./routes/warehouse');
const supplierRoutes = require('./routes/supplier');
const customerRoutes = require('./routes/customer');
const vehicleRoutes = require('./routes/vehicle');
const inboundOrderRoutes = require('./routes/inbound_order');
const outboundOrderRoutes = require('./routes/outbound_order');
const stockRoutes = require('./routes/stock');
const sysUserRoutes = require('./routes/sys_user');
const sysRoleRoutes = require('./routes/sys_role');
const userRoutes = require('./routes/user');
const stockCheckOrderRoutes = require('./routes/stock_check_order');
const sysLogRoutes = require('./routes/sys_log');
const sysDictRoutes = require('./routes/sys_dict');
const billConfigRoutes = require('./routes/bill_config');
const printTemplateRoutes = require('./routes/print_template');
const printRoutes = require('./routes/print');
const dashboardRoutes = require('./routes/dashboard');
const messageRoutes = require('./routes/message');
const sysConfigRoutes = require('./routes/sys_config');
const reportRoutes = require('./routes/report');
const scheduledTaskRoutes = require('./routes/scheduled_task');
const healthRoutes = require('./routes/health');
const backupRoutes = require('./routes/backup');
const menuSortRoutes = require('./routes/menu_sort');
const onlineUserRoutes = require('./routes/online_user');
const { sendError } = require('./utils/apiResponse');
const { normalizeApiError, HttpError } = require('./utils/httpError');
const { registerScheduledJobs } = require('./scheduled/registerScheduledJobs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use('/public', express.static('public'));

// 操作日志中间件（异步记录，不阻塞响应）
const logger = require('./middleware/logger');
app.use('/api', logger);

// 认证路由（登录不需要 JWT）
app.use('/api', authRoutes);
// 基础资料路由（需要 JWT）
app.use('/api/product/category', productCategoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/inbound/order', inboundOrderRoutes);
app.use('/api/outbound/order', outboundOrderRoutes);
app.use('/api/sys/user', sysUserRoutes);
app.use('/api/sys/role', sysRoleRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stock/check_order', stockCheckOrderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sys/log', sysLogRoutes);
app.use('/api/sys/dict', sysDictRoutes);
app.use('/api/sys/bill-config', billConfigRoutes);
app.use('/api/print/template', printTemplateRoutes);
app.use('/api/print', printRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/sys/config', sysConfigRoutes);
app.use('/api/report', reportApiLimiter, reportRoutes);
app.use('/api/sys/scheduled-task', scheduledTaskRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/system/menu', menuSortRoutes);
app.use('/api/sys/online', onlineUserRoutes);

app.use((req, res, next) => next(new HttpError(404, '接口不存在')));
app.use((err, req, res, _next) => {
  if (res.headersSent) return;
  const { httpStatus, bodyCode, message } = normalizeApiError(err, {
    isProduction: process.env.NODE_ENV === 'production'
  });
  const errorContext = {
    method: req.method,
    path: req.path,
    status: httpStatus,
    code: bodyCode,
    ip: req.ip
  };
  if (httpStatus >= 500) {
    console.error('[wms] internal error', errorContext, err);
  } else {
    console.warn('[wms] request rejected', errorContext);
  }
  sendError(res, httpStatus, message, bodyCode);
});

sequelize.authenticate()
  .then(() => sequelize.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"))
  .then(() => ensureSysUserOpenidColumn())
  .then(async () => {
    // 同步消息表、系统参数表、定时任务表
    const SysMessage = require('./models/sys_message');
    await SysMessage.sync().catch(() => {});
    const SysConfig = require('./models/sys_config');
    await SysConfig.sync().catch(() => {});
    const ScheduledTask = require('./models/scheduled_task');
    await ScheduledTask.sync().catch(() => {});
    const ScheduledTaskLog = require('./models/scheduled_task_log');
    await ScheduledTaskLog.sync().catch(() => {});
    const SysMenuSort = require('./models/sys_menu_sort');
    await SysMenuSort.sync().catch(() => {});
    const SysOnlineUser = require('./models/sys_online_user');
    await SysOnlineUser.sync().catch(() => console.log("sys_online_user sync skipped (may already exist)"));
    const UserLoginLog = require('./models/user_login_log');
    await UserLoginLog.sync().catch(() => console.log("user_login_log sync skipped (may already exist)"));
    const SysTokenBlacklist = require('./models/sys_token_blacklist');
    await SysTokenBlacklist.sync().catch(() => console.log("sys_token_blacklist sync skipped (may already exist)"));
    // 预置系统参数
    const defaults = [
      { config_key: 'alert_low_default', config_value: '20', config_name: '默认预警下限(吨)', config_group: '库存预警', sort_order: 1, remark: '新建商品入库时默认的库存预警下限' },
      { config_key: 'alert_high_default', config_value: '200', config_name: '默认预警上限(吨)', config_group: '库存预警', sort_order: 2, remark: '新建商品入库时默认的库存预警上限' },
      { config_key: 'default_password', config_value: '123456', config_name: '默认密码', config_group: '用户管理', sort_order: 3, remark: '新建用户时的初始密码' },
      { config_key: 'session_timeout', config_value: '480', config_name: '会话超时(分钟)', config_group: '用户管理', sort_order: 4, remark: '登录令牌过期时间' },
      { config_key: 'max_export_rows', config_value: '10000', config_name: '最大导出行数', config_group: '系统参数', sort_order: 5, remark: 'Excel 导出数据行数上限' },
      { config_key: 'poll_interval', config_value: '60', config_name: '消息轮询间隔(秒)', config_group: '系统参数', sort_order: 6, remark: '前端轮询未读消息的时间间隔' },
      { config_key: 'log_retention_days', config_value: '90', config_name: '日志保留天数', config_group: '系统参数', sort_order: 7, remark: '超过此天数的操作日志将被自动清理' }
    ];
    for (const d of defaults) {
      await SysConfig.findOrCreate({ where: { config_key: d.config_key }, defaults: d });
    }
    // 预置定时任务
    const taskDefaults = [
      { task_name: '库存预警检查', task_key: 'stock_alert_check', cron_expression: '0 2 * * *', description: '每日凌晨 2 点检查所有库存商品的库存吨位是否超出预警上下限' },
      { task_name: '数据库自动备份', task_key: 'auto_backup', cron_expression: '30 2 * * *', description: '每日凌晨 2:30 备份数据库，保留7天日备份+30天内周备份' },
      { task_name: '操作与安全日志自动清理', task_key: 'log_cleanup', cron_expression: '0 3 * * *', description: '每日凌晨 3:00 根据「日志保留天数」删除过期操作日志与登录安全日志（user_login_log）' }
    ];
    for (const td of taskDefaults) {
      await ScheduledTask.findOrCreate({ where: { task_key: td.task_key }, defaults: td });
    }
    // 预置菜单排序（单一数据源：config/wms_menu_presets.json，与前端 wmsMenuRegistry / wms 路由对齐）
    const menuPresets = require('./config/wms_menu_presets.json');
    const validCodes = menuPresets.map(m => m.menu_code);
    await SysMenuSort.destroy({ where: { menu_code: { [require('sequelize').Op.notIn]: validCodes } } });
    for (const md of menuPresets) {
      await SysMenuSort.upsert(md, { conflictFields: ['menu_code'] });
    }
    console.log('MySQL 数据库连接成功');
    app.listen(PORT, HOST, () => {
      console.log(`WMS 后端服务已启动，端口: ${PORT}`);
      registerScheduledJobs().catch(err => console.error('定时任务注册失败:', err));
    });
  })
  .catch(err => {
    console.error('数据库连接失败:', err.message);
  });
