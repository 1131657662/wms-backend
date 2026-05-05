const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysConfig = sequelize.define('sys_config', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  config_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  config_value: { type: DataTypes.TEXT },
  config_name: { type: DataTypes.STRING(100), allowNull: false },
  config_group: { type: DataTypes.STRING(50), defaultValue: '系统参数' },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  remark: { type: DataTypes.STRING(255) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { timestamps: false });

module.exports = SysConfig;
