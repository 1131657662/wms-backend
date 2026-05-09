ALTER TABLE sys_user
  ADD COLUMN openid VARCHAR(64) DEFAULT NULL COMMENT '微信openid',
  ADD UNIQUE INDEX idx_openid (openid);
