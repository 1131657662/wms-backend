const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysOperationLog = sequelize.define('sys_operation_log', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT },
  username: { type: DataTypes.STRING(50) },
  module: { type: DataTypes.STRING(50) },
  operation: { type: DataTypes.STRING(100) },
  operation_desc: { type: DataTypes.STRING(500) },
  business_type: { type: DataTypes.STRING(50) },
  business_id: { type: DataTypes.STRING(50) },
  request_url: { type: DataTypes.STRING(200) },
  method: { type: DataTypes.STRING(10) },
  params: { type: DataTypes.TEXT },
  ip: { type: DataTypes.STRING(50) },
  cost_time: { type: DataTypes.INTEGER },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  error_msg: { type: DataTypes.STRING(500) },
  create_time: { type: DataTypes.DATE, defaultValue: sequelize.literal("DATE_ADD(NOW(), INTERVAL 8 HOUR)") }
}, {
  tableName: 'sys_operation_log',
  timestamps: false
});

module.exports = SysOperationLog;
