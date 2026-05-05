-- 同步 sys_permission 表与前端路由模块
-- 原有 5 个 M 级权限：inbound、outbound、stock、basic、system
-- 新增 7 个缺失的顶级模块

-- 删除旧的粗粒度 'system' 权限（已被 auth/settings/monitor 拆分替代）
-- 先删掉其子权限和角色绑定
DELETE FROM sys_role_permission WHERE perm_id IN (SELECT id FROM sys_permission WHERE parent_id = 5);
DELETE FROM sys_permission WHERE parent_id = 5;
DELETE FROM sys_permission WHERE id = 5;

-- 新增 M 级权限（顶级菜单）
INSERT INTO sys_permission (id, perm_code, perm_name, parent_id, type, del_flag, sort_order, create_time, update_time) VALUES
(25, 'dashboard',    '首页',      0, 'M', 0, 1,  NOW(), NOW()),
(26, 'report',       '统计报表',  0, 'M', 0, 2,  NOW(), NOW()),
(27, 'stock-check',  '盘点管理',  0, 'M', 0, 6,  NOW(), NOW()),
(28, 'auth',         '权限管理',  0, 'M', 0, 8,  NOW(), NOW()),
(29, 'settings',     '系统配置',  0, 'M', 0, 9,  NOW(), NOW()),
(30, 'monitor',      '系统监控',  0, 'M', 0, 10, NOW(), NOW()),
(31, 'message',      '消息中心',  0, 'M', 0, 11, NOW(), NOW());

-- 新增 B 级权限（按钮级），覆盖各模块的基本操作
INSERT INTO sys_permission (id, perm_code, perm_name, parent_id, type, del_flag, sort_order, create_time, update_time) VALUES
-- 首页
(32, 'dashboard:view',     '查看首页',        25, 'B', 0, 1, NOW(), NOW()),
-- 统计报表
(33, 'report:view',        '查看报表',        26, 'B', 0, 1, NOW(), NOW()),
(34, 'report:export',      '导出报表',        26, 'B', 0, 2, NOW(), NOW()),
-- 盘点管理
(35, 'stock-check:view',   '查看盘点',        27, 'B', 0, 1, NOW(), NOW()),
(36, 'stock-check:create', '创建盘点单',      27, 'B', 0, 2, NOW(), NOW()),
(37, 'stock-check:audit',  '审核盘点单',      27, 'B', 0, 3, NOW(), NOW()),
-- 权限管理
(38, 'auth:user',          '用户管理',        28, 'B', 0, 1, NOW(), NOW()),
(39, 'auth:role',          '角色管理',        28, 'B', 0, 2, NOW(), NOW()),
(40, 'auth:menu',          '菜单排序',        28, 'B', 0, 3, NOW(), NOW()),
-- 系统配置
(41, 'settings:dict',      '数据字典',        29, 'B', 0, 1, NOW(), NOW()),
(42, 'settings:param',     '系统参数',        29, 'B', 0, 2, NOW(), NOW()),
(43, 'settings:backup',    '数据备份',        29, 'B', 0, 3, NOW(), NOW()),
-- 系统监控
(44, 'monitor:log',        '日志管理',        30, 'B', 0, 1, NOW(), NOW()),
(45, 'monitor:online',     '在线用户',        30, 'B', 0, 2, NOW(), NOW()),
(46, 'monitor:task',       '定时任务',        30, 'B', 0, 3, NOW(), NOW()),
-- 消息中心
(47, 'message:view',       '查看消息',        31, 'B', 0, 1, NOW(), NOW()),
(48, 'message:send',       '发送消息',        31, 'B', 0, 2, NOW(), NOW());
