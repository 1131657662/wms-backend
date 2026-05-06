const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockJournal = sequelize.define('stock_journal', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_code: { type: DataTypes.STRING(50), allowNull: false },
  product_name: { type: DataTypes.STRING(100) },
  product_model: { type: DataTypes.STRING(100) },
  warehouse_code: { type: DataTypes.STRING(50), allowNull: false },
  warehouse_name: { type: DataTypes.STRING(100) },
  business_type: { type: DataTypes.STRING(20), allowNull: false },
  order_no: { type: DataTypes.STRING(50) },
  change_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  change_weight: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
  before_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  before_weight: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
  after_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  after_weight: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = StockJournal;
