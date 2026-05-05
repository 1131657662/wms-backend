const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutboundOrderDetail = sequelize.define('outbound_order_detail', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  uuid: { type: DataTypes.STRING(50), allowNull: false },
  order_no: { type: DataTypes.STRING(50), allowNull: false },
  product_code: { type: DataTypes.STRING(50), allowNull: false },
  product_name: { type: DataTypes.STRING(100) },
  product_model: { type: DataTypes.STRING(100) },
  contract_no: { type: DataTypes.STRING(50) },
  outbound_weight: { type: DataTypes.DECIMAL(12, 3) },
  outbound_qty: { type: DataTypes.INTEGER },
  detail_remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = OutboundOrderDetail;
