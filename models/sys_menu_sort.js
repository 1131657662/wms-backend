const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysMenuSort = sequelize.define('sys_menu_sort', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  menu_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  parent_code: { type: DataTypes.STRING(100), defaultValue: null },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

module.exports = SysMenuSort;
