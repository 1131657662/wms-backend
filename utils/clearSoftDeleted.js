const { Op } = require('sequelize');

/**
 * 物理清除与唯一字段冲突的软删除记录。
 * MySQL 唯一索引对所有行生效（含 del_flag=1），新增/更新前需释放占用。
 *
 * @param {object} Model - Sequelize 模型
 * @param {object} values - 待写入字段值 { field: value, ... }
 * @param {string[]} uniqueFields - 模型中有唯一约束的字段名
 */
async function clearSoftDeletedConflicts(Model, values, uniqueFields) {
  const or = [];
  for (const field of uniqueFields) {
    const val = values[field];
    if (val !== undefined && val !== null && val !== '') {
      or.push({ [field]: val });
    }
  }
  if (or.length === 0) return;
  const deleted = await Model.destroy({ where: { del_flag: 1, [Op.or]: or }, force: true });
  if (deleted > 0) console.log(`[clearSoftDeleted] ${Model.name}: 物理清除 ${deleted} 条冲突记录`);
}

module.exports = { clearSoftDeletedConflicts };
