const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysTokenBlacklist = sequelize.define('sys_token_blacklist', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  token_hash: { type: DataTypes.STRING(64), allowNull: false },
  user_id: { type: DataTypes.BIGINT },
  username: { type: DataTypes.STRING(50) },
  expire_time: { type: DataTypes.DATE, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'sys_token_blacklist',
  timestamps: false
});

module.exports = SysTokenBlacklist;
