const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stock = sequelize.define('stock', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  warehouse_code: { type: DataTypes.STRING(50), allowNull: false },
  warehouse_name: { type: DataTypes.STRING(100) },
  product_code: { type: DataTypes.STRING(50), allowNull: false },
  product_name: { type: DataTypes.STRING(100) },
  product_model: { type: DataTypes.STRING(100) },
  stock_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_weight: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
  min_alert_weight: { type: DataTypes.DECIMAL(12, 4) },
  max_alert_weight: { type: DataTypes.DECIMAL(12, 4) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = Stock;
