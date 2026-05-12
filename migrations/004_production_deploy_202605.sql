-- =============================================================================
-- WMS 生产部署增量脚本（与 2026-05 代码版本配套）
-- 执行前请备份数据库。适用于 MySQL 5.7+ / 8.x。
-- =============================================================================

CREATE TABLE IF NOT EXISTS `user_login_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL COMMENT '成功登录时的用户ID',
  `username` varchar(50) NOT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `os_name` varchar(80) DEFAULT NULL,
  `browser_name` varchar(80) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1成功 0失败',
  `fail_reason` varchar(200) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_login_username_time` (`username`, `create_time`),
  KEY `idx_user_login_user_time` (`user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录安全日志';

INSERT IGNORE INTO `sys_dict_type` (`dict_code`, `dict_name`) VALUES
('message_type', '消息类型'),
('stock_alert_level', '库存预警筛选');

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`, `remark`)
SELECT * FROM (
  SELECT 'message_type' AS dict_type_code, '订单提交' AS dict_label, 'order_submit' AS dict_value, 5 AS sort_order, 1 AS is_enabled, 'warning' AS remark
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`, `remark`)
SELECT * FROM (
  SELECT 'message_type' AS dict_type_code, '订单审核' AS dict_label, 'order_audit' AS dict_value, 6 AS sort_order, 1 AS is_enabled, 'success' AS remark
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`, `remark`)
SELECT * FROM (
  SELECT 'message_type' AS dict_type_code, '预警恢复' AS dict_label, 'alert_normal' AS dict_value, 7 AS sort_order, 1 AS is_enabled, 'info' AS remark
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`)
SELECT * FROM (
  SELECT 'stock_alert_level' AS dict_type_code, '零库存' AS dict_label, 'zero' AS dict_value, 1 AS sort_order, 1 AS is_enabled
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`)
SELECT * FROM (
  SELECT 'stock_alert_level' AS dict_type_code, '低库存' AS dict_label, 'low' AS dict_value, 2 AS sort_order, 1 AS is_enabled
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`)
SELECT * FROM (
  SELECT 'stock_alert_level' AS dict_type_code, '高库存' AS dict_label, 'high' AS dict_value, 3 AS sort_order, 1 AS is_enabled
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);

INSERT INTO `sys_dict_data` (`dict_type_code`, `dict_label`, `dict_value`, `sort_order`, `is_enabled`)
SELECT * FROM (
  SELECT 'stock_alert_level' AS dict_type_code, '正常' AS dict_label, 'normal' AS dict_value, 4 AS sort_order, 1 AS is_enabled
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_dict_data` d WHERE d.dict_type_code = t.dict_type_code AND d.dict_value = t.dict_value AND d.del_flag = 0
);
