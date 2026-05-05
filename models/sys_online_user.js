const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysOnlineUser = sequelize.define('sys_online_user', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  username: { type: DataTypes.STRING(50), allowNull: false },
  nickname: { type: DataTypes.STRING(50) },
  ip: { type: DataTypes.STRING(50) },
  login_time: { type: DataTypes.DATE },
  last_active_time: { type: DataTypes.DATE, allowNull: false },
  token_hash: { type: DataTypes.STRING(64) }
}, {
  tableName: 'sys_online_user',
  timestamps: false
});

module.exports = SysOnlineUser;
