const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserLoginLog = sequelize.define(
  'user_login_log',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.BIGINT, allowNull: true, field: 'user_id' },
    username: { type: DataTypes.STRING(50), allowNull: false },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    userAgent: { type: DataTypes.STRING(500), allowNull: true, field: 'user_agent' },
    osName: { type: DataTypes.STRING(80), allowNull: true, field: 'os_name' },
    browserName: { type: DataTypes.STRING(80), allowNull: true, field: 'browser_name' },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1成功 0失败'
    },
    failReason: { type: DataTypes.STRING(200), allowNull: true, field: 'fail_reason' },
    createTime: { type: DataTypes.DATE, field: 'create_time', defaultValue: DataTypes.NOW }
  },
  {
    tableName: 'user_login_log',
    timestamps: false,
    underscored: false
  }
);

module.exports = UserLoginLog;
