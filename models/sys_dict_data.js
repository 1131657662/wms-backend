const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysDictData = sequelize.define('sys_dict_data', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  dict_type_code: { type: DataTypes.STRING(50), allowNull: false },
  dict_label: { type: DataTypes.STRING(100), allowNull: false },
  dict_value: { type: DataTypes.STRING(100), allowNull: false },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, {
  tableName: 'sys_dict_data',
  timestamps: false
});

module.exports = SysDictData;
