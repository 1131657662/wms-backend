const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledTask = sequelize.define('scheduled_task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_name: { type: DataTypes.STRING(100), allowNull: false },
  task_key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  cron_expression: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.STRING(255) },
  enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  last_run_time: { type: DataTypes.DATE },
  next_run_time: { type: DataTypes.DATE },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { timestamps: false });

module.exports = ScheduledTask;
