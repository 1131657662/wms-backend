const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('vehicle', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  plate_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  contact_name: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
});

module.exports = Vehicle;
