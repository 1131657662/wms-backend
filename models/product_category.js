const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductCategory = sequelize.define('product_category', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  category_name: { type: DataTypes.STRING(50), allowNull: false },
  parent_id: { type: DataTypes.BIGINT, defaultValue: 0 },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, {
  indexes: [
    { unique: true, fields: ['parent_id', 'category_name'] }
  ]
});

module.exports = ProductCategory;
