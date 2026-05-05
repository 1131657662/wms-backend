const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysMessage = sequelize.define('sys_message', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING(30), allowNull: false },
  business_type: { type: DataTypes.STRING(30) },
  business_id: { type: DataTypes.STRING(50) },
  receiver_id: { type: DataTypes.INTEGER },
  is_read: { type: DataTypes.TINYINT, defaultValue: 0 },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { timestamps: false });

module.exports = SysMessage;
