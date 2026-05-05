const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillConfig = sequelize.define('bill_config', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  bill_type_code: { type: DataTypes.STRING(50), allowNull: false },
  bill_type_name: { type: DataTypes.STRING(50) },
  prefix: { type: DataTypes.STRING(20) },
  serial_rule: { type: DataTypes.STRING(20) },
  serial_digits: { type: DataTypes.INTEGER },
  serial_start: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = BillConfig;
