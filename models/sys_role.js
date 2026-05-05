const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysRole = sequelize.define('sys_role', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  role_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  role_name: { type: DataTypes.STRING(50), allowNull: false },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = SysRole;
