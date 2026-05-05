const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillSerial = sequelize.define('bill_serial', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  bill_type_code: { type: DataTypes.STRING(50), allowNull: false },
  date_str: { type: DataTypes.STRING(8), allowNull: false },
  serial_no: { type: DataTypes.INTEGER, defaultValue: 0 },
  lock_version: { type: DataTypes.INTEGER, defaultValue: 0 },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = BillSerial;
