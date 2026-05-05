const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutboundOrder = sequelize.define('outbound_order', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  order_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  outbound_date: { type: DataTypes.DATEONLY },
  vehicle_no: { type: DataTypes.STRING(50) },
  container_no: { type: DataTypes.STRING(50) },
  remark: { type: DataTypes.STRING(500) },
  warehouse_code: { type: DataTypes.STRING(50) },
  bill_type_code: { type: DataTypes.STRING(50) },
  customer_code: { type: DataTypes.STRING(50) },
  customer_name: { type: DataTypes.STRING(100) },
  customer_address: { type: DataTypes.STRING(200) },
  contact_person: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  order_status: { type: DataTypes.STRING(20), defaultValue: 'draft' },
  audit_by: { type: DataTypes.STRING(50) },
  audit_time: { type: DataTypes.DATE },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 },
  lock_version: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = OutboundOrder;
