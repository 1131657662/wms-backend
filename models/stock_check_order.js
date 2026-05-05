const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { CHECK_STATUS } = require('../config/constants');

const StockCheckOrder = sequelize.define('stock_check_order', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  check_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  warehouse_code: { type: DataTypes.STRING(50) },
  warehouse_name: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.STRING(20), defaultValue: CHECK_STATUS.DRAFT },
  remark: { type: DataTypes.STRING(500) },
  audit_by: { type: DataTypes.STRING(50) },
  audit_time: { type: DataTypes.DATE },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = StockCheckOrder;
