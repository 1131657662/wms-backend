const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysPermission = sequelize.define('sys_permission', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  perm_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  perm_name: { type: DataTypes.STRING(50), allowNull: false },
  parent_id: { type: DataTypes.BIGINT, defaultValue: 0 },
  type: { type: DataTypes.CHAR(1), defaultValue: 'M' },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = SysPermission;
