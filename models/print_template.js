const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrintTemplate = sequelize.define('print_template', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  template_name: { type: DataTypes.STRING(100), allowNull: false },
  business_type: { type: DataTypes.STRING(50), allowNull: false },
  report_code: { type: DataTypes.STRING(50), allowNull: false },
  output_format: { type: DataTypes.STRING(20), defaultValue: 'PDF' },
  api_url: { type: DataTypes.STRING(255) },
  jimu_token: { type: DataTypes.STRING(100) },
  is_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE, defaultValue: sequelize.literal("(NOW() + INTERVAL 8 HOUR)") },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE, defaultValue: sequelize.literal("(NOW() + INTERVAL 8 HOUR)") },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { timestamps: false, tableName: 'print_template' });

module.exports = PrintTemplate;
