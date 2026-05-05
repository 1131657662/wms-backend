const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysRolePermission = sequelize.define('sys_role_permission', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  role_id: { type: DataTypes.BIGINT, allowNull: false },
  perm_id: { type: DataTypes.BIGINT, allowNull: false }
}, { timestamps: false });

module.exports = SysRolePermission;
