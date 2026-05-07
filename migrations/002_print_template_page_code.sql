-- ============================================================
-- 002_print_template_page_code: 打印模板增加页面绑定
-- ============================================================
ALTER TABLE `print_template`
  ADD COLUMN `page_code` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '绑定页面编码' AFTER `business_type`,
  ADD COLUMN `business_param` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '传给积木报表的businessType参数' AFTER `page_code`;

-- 迁移现有数据：入库单/出库单模板自动填充 page_code 和 business_param
UPDATE `print_template`
SET `page_code` = CONCAT(`business_type`, '_order'),
    `business_param` = `business_type`
WHERE `del_flag` = 0;
