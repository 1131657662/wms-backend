const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledTaskLog = sequelize.define('scheduled_task_log', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  task_key: { type: DataTypes.STRING(50), allowNull: false },
  task_name: { type: DataTypes.STRING(100) },
  trigger_type: { type: DataTypes.STRING(20), defaultValue: 'auto' },
  status: { type: DataTypes.STRING(20), defaultValue: 'running' },
  result_message: { type: DataTypes.STRING(500) },
  start_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  end_time: { type: DataTypes.DATE },
  duration_ms: { type: DataTypes.INTEGER },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { timestamps: false });

module.exports = ScheduledTaskLog;
