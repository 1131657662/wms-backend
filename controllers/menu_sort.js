const SysMenuSort = require('../models/sys_menu_sort');

exports.list = async (req, res) => {
  try {
    const rows = await SysMenuSort.findAll({ order: [['sort_order', 'ASC']], raw: true });
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error('获取菜单排序失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.save = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ code: 400, message: '参数错误' });

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
      res.json({ code: 200, message: '保存成功' });
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error('保存菜单排序失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
