-- ============================================================
-- WMS 仓库管理系统 - 数据库初始化脚本
-- ============================================================

CREATE DATABASE IF NOT EXISTS `wms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `wms`;

-- ============================================================
-- 3.1 商品分类表
-- ============================================================
CREATE TABLE `product_category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `category_name` varchar(50) NOT NULL COMMENT '分类名称',
  `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父分类ID，0表示顶级',
  `sort_order` int DEFAULT 0 COMMENT '排序',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- ============================================================
-- 3.2 商品表
-- ============================================================
CREATE TABLE `product` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_code` varchar(50) NOT NULL COMMENT '产品编码（唯一）',
  `product_name` varchar(100) NOT NULL COMMENT '产品名称',
  `product_model` varchar(100) DEFAULT NULL COMMENT '型号',
  `count_unit` varchar(20) DEFAULT NULL COMMENT '计数单位',
  `weight_unit` varchar(20) DEFAULT NULL COMMENT '计重单位',
  `package_type` varchar(50) DEFAULT NULL COMMENT '包装类型',
  `package_color` varchar(50) DEFAULT NULL COMMENT '包装颜色',
  `strap_color` varchar(50) DEFAULT NULL COMMENT '包带颜色',
  `category_id` bigint DEFAULT NULL COMMENT '分类ID',
  `sale_price` decimal(10,2) DEFAULT NULL COMMENT '销售参考价',
  `cost_price` decimal(10,2) DEFAULT NULL COMMENT '最近成本',
  `status` varchar(20) DEFAULT '正常' COMMENT '状态（正常/停用）',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片地址',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_code` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- ============================================================
-- 3.3 仓库表
-- ============================================================
CREATE TABLE `warehouse` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `warehouse_code` varchar(50) NOT NULL COMMENT '仓库编码（唯一）',
  `warehouse_name` varchar(100) NOT NULL COMMENT '仓库名称',
  `manager` varchar(50) DEFAULT NULL COMMENT '管理员',
  `capacity` decimal(10,2) DEFAULT NULL COMMENT '容量(吨)',
  `location` varchar(200) DEFAULT NULL COMMENT '位置',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `warehouse_type` varchar(50) DEFAULT NULL COMMENT '类型',
  `is_enabled` tinyint DEFAULT 1 COMMENT '是否启用',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_code` (`warehouse_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仓库表';

-- ============================================================
-- 3.4 供应商表
-- ============================================================
CREATE TABLE `supplier` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `supplier_code` varchar(50) NOT NULL COMMENT '编号（唯一）',
  `supplier_name` varchar(100) NOT NULL COMMENT '名称',
  `supplier_short` varchar(50) DEFAULT NULL COMMENT '简称',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `supplier_type` varchar(50) DEFAULT NULL COMMENT '类型',
  `level` varchar(20) DEFAULT NULL COMMENT '等级',
  `is_enabled` tinyint DEFAULT 1 COMMENT '启用',
  `cooperation_status` varchar(20) DEFAULT NULL COMMENT '合作状态',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_code` (`supplier_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商表';

-- ============================================================
-- 3.5 客户表
-- ============================================================
CREATE TABLE `customer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `customer_code` varchar(50) NOT NULL COMMENT '编码（唯一）',
  `customer_name` varchar(100) NOT NULL COMMENT '名称',
  `address` varchar(200) DEFAULT NULL COMMENT '地址',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `credit_limit` decimal(12,2) DEFAULT NULL COMMENT '信用额度',
  `customer_level` varchar(20) DEFAULT NULL COMMENT '等级(A/B/C)',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_code` (`customer_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

-- ============================================================
-- 3.6 车辆表
-- ============================================================
CREATE TABLE `vehicle` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `plate_number` varchar(20) NOT NULL COMMENT '车号（唯一）',
  `contact_name` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `status` tinyint DEFAULT 1 COMMENT '状态（1可用/2维修/3停用）',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plate_number` (`plate_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆表';

-- ============================================================
-- 3.7 单据配置表
-- ============================================================
CREATE TABLE `bill_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `bill_type_code` varchar(50) NOT NULL COMMENT '类型编码(inbound/outbound/customer_code/supplier_code/warehouse_code)',
  `bill_type_name` varchar(50) NOT NULL COMMENT '名称',
  `prefix` varchar(20) NOT NULL COMMENT '单号前缀',
  `serial_rule` varchar(20) NOT NULL COMMENT '规则(date_seq/pure_seq)',
  `serial_digits` int NOT NULL COMMENT '序号位数',
  `serial_start` int DEFAULT 1 COMMENT '起始值',
  `is_enabled` tinyint DEFAULT 1 COMMENT '启用',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单据配置表';

-- ============================================================
-- 3.8 单号流水表
-- ============================================================
CREATE TABLE `bill_serial` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `bill_type_code` varchar(50) NOT NULL COMMENT '单据类型',
  `date_str` varchar(8) NOT NULL COMMENT '日期yyyyMMdd（pure_seq时可为00000000）',
  `serial_no` int NOT NULL DEFAULT 0 COMMENT '当前序号',
  `lock_version` int DEFAULT 0 COMMENT '乐观锁版本号',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_date` (`bill_type_code`, `date_str`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单号流水表';

-- ============================================================
-- 3.9 入库订单主表
-- ============================================================
CREATE TABLE `inbound_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(50) NOT NULL COMMENT '单据编号（唯一）',
  `inbound_date` date DEFAULT NULL COMMENT '入库日期',
  `vehicle_no` varchar(50) DEFAULT NULL COMMENT '车号',
  `container_no` varchar(50) DEFAULT NULL COMMENT '柜号',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `warehouse_code` varchar(50) DEFAULT NULL COMMENT '仓库编码',
  `bill_type_code` varchar(50) DEFAULT NULL COMMENT '单据类型',
  `supplier_code` varchar(50) DEFAULT NULL COMMENT '供应商编号',
  `delivery_no` varchar(50) DEFAULT NULL COMMENT '来货单号',
  `order_status` varchar(20) DEFAULT 'draft' COMMENT '状态(draft/submit/audited/cancelled)',
  `audit_by` varchar(50) DEFAULT NULL COMMENT '审核人',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入库订单主表';

-- ============================================================
-- 3.10 入库订单明细表
-- ============================================================
CREATE TABLE `inbound_order_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `uuid` varchar(50) NOT NULL COMMENT '唯一标识',
  `order_no` varchar(50) NOT NULL COMMENT '关联主表编号',
  `product_code` varchar(50) NOT NULL COMMENT '产品编码',
  `product_name` varchar(100) DEFAULT NULL COMMENT '产品名称（冗余）',
  `product_model` varchar(100) DEFAULT NULL COMMENT '型号（冗余）',
  `inbound_weight` decimal(12,3) DEFAULT NULL COMMENT '入库吨位',
  `inbound_qty` int DEFAULT NULL COMMENT '入库件数',
  `detail_remark` varchar(200) DEFAULT NULL COMMENT '明细备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入库订单明细表';

-- ============================================================
-- 3.11 出库订单主表
-- ============================================================
CREATE TABLE `outbound_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(50) NOT NULL COMMENT '单据编号（唯一）',
  `outbound_date` date DEFAULT NULL COMMENT '出库日期',
  `vehicle_no` varchar(50) DEFAULT NULL COMMENT '车号',
  `container_no` varchar(50) DEFAULT NULL COMMENT '柜号',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `warehouse_code` varchar(50) DEFAULT NULL COMMENT '仓库编码',
  `bill_type_code` varchar(50) DEFAULT NULL COMMENT '单据类型',
  `customer_code` varchar(50) DEFAULT NULL COMMENT '客户编码',
  `customer_name` varchar(100) DEFAULT NULL COMMENT '客户名称（冗余）',
  `customer_address` varchar(200) DEFAULT NULL COMMENT '客户地址',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `order_status` varchar(20) DEFAULT 'draft' COMMENT '状态(draft/submit/audited/cancelled)',
  `audit_by` varchar(50) DEFAULT NULL COMMENT '审核人',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出库订单主表';

-- ============================================================
-- 3.12 出库订单明细表
-- ============================================================
CREATE TABLE `outbound_order_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `uuid` varchar(50) NOT NULL COMMENT '唯一标识',
  `order_no` varchar(50) NOT NULL COMMENT '关联主表编号',
  `product_code` varchar(50) NOT NULL COMMENT '产品编码',
  `product_name` varchar(100) DEFAULT NULL COMMENT '产品名称（冗余）',
  `product_model` varchar(100) DEFAULT NULL COMMENT '型号（冗余）',
  `contract_no` varchar(50) DEFAULT NULL COMMENT '合同号',
  `outbound_weight` decimal(12,3) DEFAULT NULL COMMENT '出库吨位',
  `outbound_qty` int DEFAULT NULL COMMENT '出库件数',
  `detail_remark` varchar(200) DEFAULT NULL COMMENT '明细备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出库订单明细表';

-- ============================================================
-- 3.13 库存表
-- ============================================================
CREATE TABLE `stock` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `warehouse_code` varchar(50) NOT NULL COMMENT '仓库编码',
  `warehouse_name` varchar(100) DEFAULT NULL COMMENT '仓库名称',
  `product_code` varchar(50) NOT NULL COMMENT '产品编码',
  `product_name` varchar(100) DEFAULT NULL COMMENT '产品名称',
  `product_model` varchar(100) DEFAULT NULL COMMENT '型号',
  `stock_qty` int DEFAULT 0 COMMENT '库存件数',
  `stock_weight` decimal(12,3) DEFAULT 0.000 COMMENT '库存吨位',
  `min_alert_weight` decimal(12,3) DEFAULT NULL COMMENT '最低预警吨位',
  `max_alert_weight` decimal(12,3) DEFAULT NULL COMMENT '最高预警吨位',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_product` (`warehouse_code`, `product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- ============================================================
-- 3.14 库存流水表
-- ============================================================
CREATE TABLE `stock_journal` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_code` varchar(50) NOT NULL COMMENT '产品编码',
  `product_name` varchar(100) DEFAULT NULL COMMENT '产品名称',
  `product_model` varchar(100) DEFAULT NULL COMMENT '型号',
  `warehouse_code` varchar(50) NOT NULL COMMENT '仓库编码',
  `warehouse_name` varchar(100) DEFAULT NULL COMMENT '仓库名称',
  `business_type` varchar(20) NOT NULL COMMENT 'inbound/outbound/check',
  `order_no` varchar(50) DEFAULT NULL COMMENT '关联单据号',
  `change_qty` int DEFAULT 0 COMMENT '变动件数（正入负出）',
  `change_weight` decimal(12,3) DEFAULT 0.000 COMMENT '变动吨位',
  `before_qty` int DEFAULT 0 COMMENT '变动前件数',
  `before_weight` decimal(12,3) DEFAULT 0.000 COMMENT '变动前吨位',
  `after_qty` int DEFAULT 0 COMMENT '变动后件数',
  `after_weight` decimal(12,3) DEFAULT 0.000 COMMENT '变动后吨位',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_warehouse_product` (`warehouse_code`, `product_code`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存流水表';

-- ============================================================
-- 3.15 盘点主表
-- ============================================================
CREATE TABLE `stock_check_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `check_no` varchar(50) NOT NULL COMMENT '盘点单号',
  `warehouse_code` varchar(50) NOT NULL COMMENT '仓库编码',
  `check_date` date DEFAULT NULL COMMENT '盘点日期',
  `status` varchar(20) DEFAULT 'draft' COMMENT 'draft/confirmed/adjusted',
  `total_diff_weight` decimal(12,3) DEFAULT NULL COMMENT '差异总吨位',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点主表';

-- ============================================================
-- 3.16 盘点明细表
-- ============================================================
CREATE TABLE `stock_check_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `check_no` varchar(50) NOT NULL COMMENT '关联主表',
  `product_code` varchar(50) NOT NULL COMMENT '产品编码',
  `before_qty` int DEFAULT 0 COMMENT '盘点前件数',
  `before_weight` decimal(12,3) DEFAULT 0.000 COMMENT '盘点前吨位',
  `actual_qty` int DEFAULT 0 COMMENT '实盘件数',
  `actual_weight` decimal(12,3) DEFAULT 0.000 COMMENT '实盘吨位',
  `diff_qty` int DEFAULT 0 COMMENT '差异件数',
  `diff_weight` decimal(12,3) DEFAULT 0.000 COMMENT '差异吨位',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_check_no` (`check_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点明细表';

-- ============================================================
-- 3.17 用户表
-- ============================================================
CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(50) NOT NULL COMMENT '用户名（唯一）',
  `password` varchar(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `status` tinyint DEFAULT 1 COMMENT '状态（1正常 0停用）',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- ============================================================
-- 3.18 角色表
-- ============================================================
CREATE TABLE `sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_code` varchar(50) NOT NULL COMMENT '角色编码（如 ADMIN, OPERATOR, AUDITOR）',
  `role_name` varchar(50) NOT NULL COMMENT '角色名称',
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ============================================================
-- 3.19 用户角色关联表
-- ============================================================
CREATE TABLE `sys_user_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ============================================================
-- 3.20 权限表
-- ============================================================
CREATE TABLE `sys_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `perm_code` varchar(100) NOT NULL COMMENT '权限编码，如 inbound:audit, outbound:audit, stock:check',
  `perm_name` varchar(50) NOT NULL,
  `parent_id` bigint DEFAULT 0,
  `type` char(1) DEFAULT 'M' COMMENT 'M-菜单, B-按钮',
  `sort_order` int DEFAULT 0,
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_perm_code` (`perm_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- ============================================================
-- 3.21 角色权限关联表
-- ============================================================
CREATE TABLE `sys_role_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` bigint NOT NULL,
  `perm_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_perm_id` (`perm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';


-- ============================================================
-- 初始化数据
-- ============================================================

-- 默认角色
INSERT INTO `sys_role` (`role_code`, `role_name`, `remark`) VALUES
('ADMIN', '系统管理员', '拥有所有权限'),
('OPERATOR', '操作员', '只能创建单据、查看库存，不能审核'),
('AUDITOR', '审核员', '可以审核出入库单据，不能创建');

-- 默认权限
INSERT INTO `sys_permission` (`perm_code`, `perm_name`, `type`) VALUES
('inbound:audit', '入库单审核', 'B'),
('outbound:audit', '出库单审核', 'B'),
('stock:check', '库存盘点调整', 'B'),
('base:manage', '基础资料管理', 'M');

-- 角色权限关联（管理员=全部，审核员=审核权限，操作员=无额外权限）
-- 管理员(id=1) 拥有所有权限(id=1,2,3,4)
INSERT INTO `sys_role_permission` (`role_id`, `perm_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);
-- 审核员(id=3) 拥有 inbound:audit(id=1), outbound:audit(id=2)
INSERT INTO `sys_role_permission` (`role_id`, `perm_id`) VALUES
(3, 1), (3, 2);

-- 单据配置（编码规则）
INSERT INTO `bill_config` (`bill_type_code`, `bill_type_name`, `prefix`, `serial_rule`, `serial_digits`, `serial_start`, `is_enabled`) VALUES
('inbound', '入库订单', 'IN', 'date_seq', 3, 1, 1),
('outbound', '出库订单', 'OUT', 'date_seq', 3, 1, 1),
('customer_code', '客户编码', 'CUST', 'pure_seq', 6, 1, 1),
('supplier_code', '供应商编码', 'SUPP', 'pure_seq', 6, 1, 1),
('warehouse_code', '仓库编码', 'WH', 'pure_seq', 3, 1, 1);

-- 示例仓库
INSERT INTO `warehouse` (`warehouse_code`, `warehouse_name`, `manager`, `capacity`, `location`, `contact_phone`, `warehouse_type`, `is_enabled`) VALUES
('WH001', '一号仓库', '张三', 500.00, 'A区1号', '13800001111', '普通仓', 1);

-- 示例商品分类
INSERT INTO `product_category` (`category_name`, `parent_id`, `sort_order`) VALUES
('原材料', 0, 1),
('成品', 0, 2);

-- 示例商品
INSERT INTO `product` (`product_code`, `product_name`, `product_model`, `count_unit`, `weight_unit`, `package_type`, `package_color`, `strap_color`, `category_id`, `sale_price`, `cost_price`, `status`, `remark`) VALUES
('P001', '示例螺纹钢', 'HRB400-16mm', '件', '吨', '捆装', '蓝色', '白色', 1, 4200.00, 3800.00, '正常', '示例商品，用于开发测试');

-- 示例供应商
INSERT INTO `supplier` (`supplier_code`, `supplier_name`, `supplier_short`, `contact_person`, `contact_phone`, `contact_email`, `supplier_type`, `level`, `is_enabled`, `cooperation_status`, `remark`) VALUES
('SUPP000001', '示例钢铁供应商', '示例钢供', '李四', '13900002222', 'lisi@example.com', '生产商', 'A', 1, '合作中', '示例供应商，用于开发测试');

-- 示例客户
INSERT INTO `customer` (`customer_code`, `customer_name`, `address`, `contact_person`, `contact_phone`, `credit_limit`, `customer_level`) VALUES
('CUST000001', '示例建筑公司', 'XX省XX市XX区XX路100号', '王五', '13700003333', 500000.00, 'A');

-- ============================================================
-- 用户数据（密码均为 admin123，已通过 bcrypt.hashSync('admin123', 10) 加密）
-- ============================================================
INSERT INTO `sys_user` (`username`, `password`, `nickname`, `status`) VALUES
('admin', '$2b$10$iC9NzEKKBzSesEu1zPUn8eYpkzuTW9QwnJXXiMVL.rPoj0Y5ZffGq', '超级管理员', 1),
('operator', '$2b$10$tsMNnOCZAsf3IHSdLSRR0.AVmHFAAl8Zcj01I0NVHtzGZUHSN0uJm', '操作员', 1),
('auditor', '$2b$10$x42FvYjWHkFTAaIIoInRdu8zgLkvPRGfuaftWNHIeLFLv9KqxcQf.', '审核员', 1);

INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1), (2, 2), (3, 3);


-- ============================================================
-- 4.1 字典类型表
-- ============================================================
CREATE TABLE `sys_dict_type` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dict_code` varchar(50) NOT NULL COMMENT '字典编码',
  `dict_name` varchar(100) NOT NULL COMMENT '字典名称',
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dict_code` (`dict_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类型表';

-- ============================================================
-- 4.2 字典数据表
-- ============================================================
CREATE TABLE `sys_dict_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dict_type_code` varchar(50) NOT NULL COMMENT '关联字典类型编码',
  `dict_label` varchar(100) NOT NULL COMMENT '显示文本',
  `dict_value` varchar(100) NOT NULL COMMENT '取值',
  `sort_order` int DEFAULT 0,
  `is_enabled` tinyint DEFAULT 1,
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典数据表';

-- ============================================================
-- 4.3 系统配置表
-- ============================================================
CREATE TABLE `sys_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `config_name` varchar(100) NOT NULL,
  `config_group` varchar(50) DEFAULT '系统参数',
  `sort_order` int DEFAULT 0,
  `remark` varchar(255) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 字典类型初始数据
-- ============================================================
INSERT INTO `sys_dict_type` (`dict_code`, `dict_name`) VALUES
('supplier_level', '供应商等级'),
('customer_level', '客户等级'),
('supplier_type', '供应商类型'),
('cooperation_status', '合作状态'),
('product_status', '商品状态'),
('inbound_type', '入库类型'),
('outbound_type', '出库类型');

-- ============================================================
-- 字典数据初始数据
-- ============================================================
INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`) VALUES
-- 供应商等级
('supplier_level', 'A级(优)', 'A', 1),
('supplier_level', 'B级(良)', 'B', 2),
('supplier_level', 'C级(中)', 'C', 3),
-- 客户等级
('customer_level', 'A级(优)', 'A', 1),
('customer_level', 'B级(良)', 'B', 2),
('customer_level', 'C级(中)', 'C', 3),
-- 供应商类型
('supplier_type', '厂家', '厂家', 1),
('supplier_type', '经销商', '经销商', 2),
('supplier_type', '代理商', '代理商', 3),
('supplier_type', '其他', '其他', 4),
-- 合作状态
('cooperation_status', '合作中', '合作中', 1),
('cooperation_status', '已暂停', '已暂停', 2),
('cooperation_status', '已终止', '已终止', 3),
-- 商品状态
('product_status', '正常', '正常', 1),
('product_status', '停用', '停用', 2),
-- 入库类型
('inbound_type', '采购入库', '采购入库', 1),
('inbound_type', '退货入库', '退货入库', 2),
('inbound_type', '调拨入库', '调拨入库', 3),
('inbound_type', '生产入库', '生产入库', 4),
('inbound_type', '盘盈入库', '盘盈入库', 5),
('inbound_type', '其他入库', '其他入库', 6),
-- 出库类型
('outbound_type', '销售出库', '销售出库', 1),
('outbound_type', '退货出库', '退货出库', 2),
('outbound_type', '调拨出库', '调拨出库', 3),
('outbound_type', '生产领料', '生产领料', 4),
('outbound_type', '盘亏出库', '盘亏出库', 5),
('outbound_type', '其他出库', '其他出库', 6);

-- ============================================================
-- 系统配置初始数据
-- ============================================================
INSERT INTO `sys_config` (`config_key`, `config_value`, `config_name`, `config_group`, `sort_order`, `remark`, `create_time`, `update_time`) VALUES
('alert_low_default', '20', '默认预警下限(吨)', '库存预警', 1, '新建商品入库时默认的库存预警下限', NOW(), NOW()),
('alert_high_default', '200', '默认预警上限(吨)', '库存预警', 2, '新建商品入库时默认的库存预警上限', NOW(), NOW()),
('default_password', '123456', '默认密码', '用户管理', 3, '新建用户时的初始密码', NOW(), NOW()),
('session_timeout', '480', '会话超时(分钟)', '用户管理', 4, '登录令牌过期时间', NOW(), NOW()),
('max_export_rows', '10000', '最大导出行数', '系统参数', 5, 'Excel 导出数据行数上限', NOW(), NOW()),
('poll_interval', '60', '消息轮询间隔(秒)', '系统参数', 6, '前端轮询未读消息的时间间隔', NOW(), NOW()),
('log_retention_days', '90', '日志保留天数', '系统参数', 7, '超过此天数的操作日志将被自动清理', NOW(), NOW());

-- ============================================================
-- 补充：盘点单单据编码配置
-- ============================================================
INSERT INTO `bill_config` (`bill_type_code`, `bill_type_name`, `prefix`, `serial_rule`, `serial_digits`, `serial_start`, `is_enabled`) VALUES
('check', '盘点单', 'PD', 'date_seq', 4, 1, 1)
ON DUPLICATE KEY UPDATE `bill_type_code` = `bill_type_code`;
