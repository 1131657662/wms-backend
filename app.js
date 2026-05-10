const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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
app.use('/api/report', reportRoutes);
app.use('/api/sys/scheduled-task', scheduledTaskRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/system/menu', menuSortRoutes);
app.use('/api/sys/online', onlineUserRoutes);

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
      { task_name: '操作日志自动清理', task_key: 'log_cleanup', cron_expression: '0 3 * * *', description: '每日凌晨 3:00 根据"日志保留天数"自动删除过期操作日志' }
    ];
    for (const td of taskDefaults) {
      await ScheduledTask.findOrCreate({ where: { task_key: td.task_key }, defaults: td });
    }
    // 预置菜单排序（与前端 src/router/modules/wms.ts 对齐）
    const menuDefaults = [
      // 1. 首页
      { menu_code: 'dashboard', parent_code: null, sort_order: 1 },
      { menu_code: '/dashboard/analysis', parent_code: 'dashboard', sort_order: 1 },
      { menu_code: '/dashboard/workplace', parent_code: 'dashboard', sort_order: 2 },
      // 2. 统计报表
      { menu_code: 'report', parent_code: null, sort_order: 2 },
      { menu_code: '/report/monthly-summary', parent_code: 'report', sort_order: 1 },
      { menu_code: '/report/turnover', parent_code: 'report', sort_order: 2 },
      { menu_code: '/report/inbound-detail', parent_code: 'report', sort_order: 3 },
      { menu_code: '/report/outbound-detail', parent_code: 'report', sort_order: 4 },
      { menu_code: '/report/stock-journal', parent_code: 'report', sort_order: 5 },
      { menu_code: '/report/period-summary', parent_code: 'report', sort_order: 6 },
      { menu_code: '/report/stock-aging', parent_code: 'report', sort_order: 7 },
      // 3. 基础资料
      { menu_code: 'base', parent_code: null, sort_order: 3 },
      { menu_code: '/product-category', parent_code: 'base', sort_order: 1 },
      { menu_code: '/product', parent_code: 'base', sort_order: 2 },
      { menu_code: '/warehouse', parent_code: 'base', sort_order: 3 },
      { menu_code: '/supplier', parent_code: 'base', sort_order: 4 },
      { menu_code: '/customer', parent_code: 'base', sort_order: 5 },
      { menu_code: '/vehicle', parent_code: 'base', sort_order: 6 },
      // 4. 入库管理
      { menu_code: 'inbound', parent_code: null, sort_order: 4 },
      { menu_code: '/inbound/list', parent_code: 'inbound', sort_order: 1 },
      // 5. 出库管理
      { menu_code: 'outbound', parent_code: null, sort_order: 5 },
      { menu_code: '/outbound/list', parent_code: 'outbound', sort_order: 1 },
      // 6. 盘点管理
      { menu_code: 'stock-check', parent_code: null, sort_order: 6 },
      { menu_code: '/stock-check/list', parent_code: 'stock-check', sort_order: 1 },
      // 7. 库存管理
      { menu_code: 'stock', parent_code: null, sort_order: 7 },
      { menu_code: '/stock/list', parent_code: 'stock', sort_order: 1 },
      // 8. 权限管理
      { menu_code: 'auth', parent_code: null, sort_order: 8 },
      { menu_code: '/auth/user', parent_code: 'auth', sort_order: 1 },
      { menu_code: '/auth/role', parent_code: 'auth', sort_order: 2 },
      { menu_code: '/auth/menu-sort', parent_code: 'auth', sort_order: 3 },
      // 9. 系统配置
      { menu_code: 'settings', parent_code: null, sort_order: 9 },
      { menu_code: '/settings/dict', parent_code: 'settings', sort_order: 1 },
      { menu_code: '/settings/param', parent_code: 'settings', sort_order: 2 },
      { menu_code: '/settings/bill', parent_code: 'settings', sort_order: 3 },
      { menu_code: '/settings/print', parent_code: 'settings', sort_order: 4 },
      { menu_code: '/settings/backup', parent_code: 'settings', sort_order: 5 },
      // 10. 系统监控
      { menu_code: 'monitor', parent_code: null, sort_order: 10 },
      { menu_code: '/monitor/log', parent_code: 'monitor', sort_order: 1 },
      { menu_code: '/monitor/online', parent_code: 'monitor', sort_order: 2 },
      { menu_code: '/monitor/task', parent_code: 'monitor', sort_order: 3 },
      { menu_code: '/monitor/health', parent_code: 'monitor', sort_order: 4 },
      // 11. 消息中心
      { menu_code: 'message', parent_code: null, sort_order: 11 },
      { menu_code: '/message/center', parent_code: 'message', sort_order: 1 }
    ];
    // 清理不在新默认列表中的旧菜单编码
    const validCodes = menuDefaults.map(m => m.menu_code);
    await SysMenuSort.destroy({ where: { menu_code: { [require('sequelize').Op.notIn]: validCodes } } });
    for (const md of menuDefaults) {
      await SysMenuSort.upsert(md, { conflictFields: ['menu_code'] });
    }
    console.log('MySQL 数据库连接成功');
    app.listen(PORT, () => {
      console.log(`WMS 后端服务已启动，端口: ${PORT}`);
      // 启动定时任务：每天凌晨2点检查库存预警
      const cron = require('node-cron');
      const { checkAllStocks } = require('./scheduled/stockAlertCheck');
      cron.schedule('0 2 * * *', async () => {
        const startTime = new Date();
        const logEntry = await ScheduledTaskLog.create({ task_key: 'stock_alert_check', task_name: '库存预警检查', trigger_type: 'auto', status: 'running', start_time: startTime });
        try {
          await checkAllStocks();
          await logEntry.update({ status: 'success', result_message: '执行成功', end_time: new Date(), duration_ms: new Date() - startTime });
          await ScheduledTask.update({ last_run_time: new Date() }, { where: { task_key: 'stock_alert_check' } });
        } catch (e) {
          await logEntry.update({ status: 'failed', result_message: e.message, end_time: new Date(), duration_ms: new Date() - startTime });
        }
      });
      console.log('库存预警定时任务已启动（每天 02:00）');
      // 自动备份任务：每天凌晨2:30
      const { autoBackup } = require('./controllers/backup');
      cron.schedule('30 2 * * *', async () => {
        const startTime = new Date();
        const logEntry = await ScheduledTaskLog.create({ task_key: 'auto_backup', task_name: '数据库自动备份', trigger_type: 'auto', status: 'running', start_time: startTime });
        try {
          await autoBackup();
          await logEntry.update({ status: 'success', result_message: '备份成功', end_time: new Date(), duration_ms: new Date() - startTime });
          await ScheduledTask.update({ last_run_time: new Date() }, { where: { task_key: 'auto_backup' } });
        } catch (e) {
          await logEntry.update({ status: 'failed', result_message: e.message, end_time: new Date(), duration_ms: new Date() - startTime });
        }
      });
      console.log('数据库自动备份任务已启动（每天 02:30，保留7天日备份+30天周备份）');
      // 操作日志清理任务：每天凌晨3:00
      const { doClean } = require('./controllers/sys_log');
      cron.schedule('0 3 * * *', async () => {
        try { await doClean(); } catch (e) { console.error('日志清理定时任务失败:', e.message); }
      });
      console.log('操作日志清理任务已启动（每天 03:00）');
      // 黑名单过期清理任务：每7小时清理一次
      const { cleanExpiredBlacklist } = require('./controllers/online_user');
      cron.schedule('0 */7 * * *', async () => {
        try { await cleanExpiredBlacklist(); } catch (e) { console.error('黑名单清理任务失败:', e.message); }
      });
      console.log('Token 黑名单清理任务已启动（每7小时）');
      // 启动时立即执行一次检查
      checkAllStocks();
    });
  })
  .catch(err => {
    console.error('数据库连接失败:', err.message);
  });
