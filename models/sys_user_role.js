const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysUserRole = sequelize.define('sys_user_role', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  role_id: { type: DataTypes.BIGINT, allowNull: false }
});

module.exports = SysUserRole;
