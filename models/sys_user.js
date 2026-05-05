const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysUser = sequelize.define('sys_user', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  nickname: { type: DataTypes.STRING(50) },
  email: { type: DataTypes.STRING(100) },
  phone: { type: DataTypes.STRING(20) },
  avatar: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = SysUser;
