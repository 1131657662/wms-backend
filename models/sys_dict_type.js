const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysDictType = sequelize.define('sys_dict_type', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  dict_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  dict_name: { type: DataTypes.STRING(100), allowNull: false },
  remark: { type: DataTypes.STRING(200) },
  create_by: { type: DataTypes.STRING(50) },
  create_time: { type: DataTypes.DATE },
  update_by: { type: DataTypes.STRING(50) },
  update_time: { type: DataTypes.DATE },
  del_flag: { type: DataTypes.TINYINT, defaultValue: 0 }
}, {
  tableName: 'sys_dict_type',
  timestamps: false
});

module.exports = SysDictType;
