const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockCheckDetail = sequelize.define('stock_check_detail', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  check_no: { type: DataTypes.STRING(50), allowNull: false },
  product_code: { type: DataTypes.STRING(50) },
  product_name: { type: DataTypes.STRING(100) },
  product_model: { type: DataTypes.STRING(100) },
  before_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  before_weight: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
  actual_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  actual_weight: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
  diff_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  diff_weight: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = StockCheckDetail;
