'use strict';

const SysMenuSort = require('../models/sys_menu_sort');
const sequelize = require('../config/database');

async function listAll() {
  return SysMenuSort.findAll({ order: [['sort_order', 'ASC']], raw: true });
}

/**
 * @param {{ menu_code: string; sort_order: number }[]} items
 */
async function saveOrder(items) {
  const t = await sequelize.transaction();
  try {
    for (const item of items) {
      await SysMenuSort.update(
        { sort_order: item.sort_order, update_time: new Date() },
        { where: { menu_code: item.menu_code }, transaction: t }
      );
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

module.exports = { listAll, saveOrder };
