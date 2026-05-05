const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('product', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  product_name: { type: DataTypes.STRING(100), allowNull: false },
  product_model: { type: DataTypes.STRING(100), unique: true },
  count_unit: { type: DataTypes.STRING(20) },
  weight_unit: { type: DataTypes.STRING(20) },
  package_type: { type: DataTypes.STRING(50) },
  package_color: { type: DataTypes.STRING(50) },
  strap_color: { type: DataTypes.STRING(50) },
  category_id: { type: DataTypes.BIGINT },
  sale_price: { type: DataTypes.DECIMAL(10, 2) },
  cost_price: { type: DataTypes.DECIMAL(10, 2) },
  default_min_alert_weight: { type: DataTypes.DECIMAL(12, 3) },
  default_max_alert_weight: { type: DataTypes.DECIMAL(12, 3) },
  status: { type: DataTypes.STRING(20), defaultValue: '正常' },
  remark: { type: DataTypes.STRING(500) },
  image_url: { type: DataTypes.TEXT },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = Product;
