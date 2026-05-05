const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('warehouse', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  warehouse_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  warehouse_name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  manager: { type: DataTypes.STRING(50) },
  capacity: { type: DataTypes.DECIMAL(10, 2) },
  location: { type: DataTypes.STRING(200) },
  contact_phone: { type: DataTypes.STRING(20) },
  warehouse_type: { type: DataTypes.STRING(50) },
  is_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = Warehouse;
