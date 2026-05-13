const SysMenuSort = require('../models/sys_menu_sort');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

exports.list = async (req, res) => {
  try {
    const rows = await SysMenuSort.findAll({ order: [['sort_order', 'ASC']], raw: true });
    return sendSuccess(res, { list: rows, total: rows.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('获取菜单排序失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.save = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) throw new HttpError(400, '参数错误');

    const sequelize = require('../config/database');
    const t = await sequelize.transaction();
    try {
      for (const item of items) {
        await SysMenuSort.update(
          { sort_order: item.sort_order, update_time: new Date() },
          { where: { menu_code: item.menu_code }, transaction: t }
        );
      }
      await t.commit();
      return sendSuccess(res, null, '保存成功');
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('保存菜单排序失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};