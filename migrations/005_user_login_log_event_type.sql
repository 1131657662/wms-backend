-- 用户安全日志：区分登录 / 改密 / 资料 / 头像等事件（执行一次即可）
-- 若列已存在会报错，可忽略或先检查 information_schema。

ALTER TABLE `user_login_log`
  ADD COLUMN `event_type` varchar(32) NOT NULL DEFAULT 'login'
  COMMENT 'login|password_change|profile_update|avatar_update'
  AFTER `fail_reason`;
