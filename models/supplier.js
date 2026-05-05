const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('supplier', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  supplier_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  supplier_name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  supplier_short: { type: DataTypes.STRING(50) },
  contact_person: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  contact_email: { type: DataTypes.STRING(100) },
  supplier_type: { type: DataTypes.STRING(50) },
  level: { type: DataTypes.STRING(20) },
  is_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  cooperation_status: { type: DataTypes.STRING(20) },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = Supplier;
