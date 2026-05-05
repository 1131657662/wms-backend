const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('customer', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  customer_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  customer_name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  address: { type: DataTypes.STRING(200) },
  contact_person: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  credit_limit: { type: DataTypes.DECIMAL(12, 2) },
  customer_level: { type: DataTypes.STRING(20) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = Customer;
