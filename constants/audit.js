'use strict';

/** 操作日志 sys_operation_log.status（与库 tinyint 一致） */
exports.OP_LOG_STATUS = Object.freeze({
  FAIL: 0,
  SUCCESS: 1
});

exports.opLogStatusToLabel = v =>
  Number(v) === exports.OP_LOG_STATUS.SUCCESS ? '成功' : '失败';

/** 登录安全日志 user_login_log.event_type */
exports.LOGIN_LOG_EVENT = Object.freeze({
  LOGIN: 'login',
  PASSWORD_CHANGE: 'password_change',
  PROFILE_UPDATE: 'profile_update',
  AVATAR_UPDATE: 'avatar_update'
});

const { LOGIN_LOG_EVENT } = exports;

/**
 * @param {object} row Sequelize plain 或 snake 字段
 */
exports.loginLogSummary = row => {
  const status = Number(row.status);
  const fail = row.failReason ?? row.fail_reason ?? '';
  const et = row.eventType ?? row.event_type ?? LOGIN_LOG_EVENT.LOGIN;

  if (et === LOGIN_LOG_EVENT.LOGIN) {
    return status === 1 ? '登录成功' : `登录失败${fail ? `（${fail}）` : ''}`;
  }
  if (et === LOGIN_LOG_EVENT.PASSWORD_CHANGE) {
    return status === 1 ? '修改密码成功' : `修改密码失败${fail ? `（${fail}）` : ''}`;
  }
  if (et === LOGIN_LOG_EVENT.PROFILE_UPDATE) {
    return status === 1 ? '更新个人资料' : `更新个人资料失败${fail ? `（${fail}）` : ''}`;
  }
  if (et === LOGIN_LOG_EVENT.AVATAR_UPDATE) {
    return status === 1 ? '更新头像' : `更新头像失败${fail ? `（${fail}）` : ''}`;
  }
  return status === 1 ? '安全事件' : `安全事件失败${fail ? `（${fail}）` : ''}`;
};
