const { Op } = require('sequelize');
const SysDictType = require('../models/sys_dict_type');
const SysDictData = require('../models/sys_dict_data');

// ===== 字典类型 CRUD =====

exports.listType = async (req, res) => {
  try {
    const { page = 1, pageSize = 100, keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { dict_code: { [Op.like]: `%${keyword}%` } },
        { dict_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await SysDictType.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 200, data: { list: rows, total: count } });
  } catch (err) {
    console.error('字典类型列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.createType = async (req, res) => {
  try {
    const { dict_code, dict_name, remark } = req.body;
    if (!dict_code || !dict_name) return res.status(400).json({ code: 400, message: '字典编码和名称不能为空' });
    const exist = await SysDictType.findOne({ where: { dict_code, del_flag: 0 } });
    if (exist) return res.status(400).json({ code: 400, message: '字典编码已存在' });
    const type = await SysDictType.create({ dict_code, dict_name, remark, create_by: req.user.username });
    res.json({ code: 200, message: '创建成功', data: type });
  } catch (err) {
    console.error('创建字典类型失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.updateType = async (req, res) => {
  try {
    const type = await SysDictType.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!type) return res.status(404).json({ code: 404, message: '字典类型不存在' });
    const { dict_name, remark } = req.body;
    await type.update({ dict_name, remark, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data: type });
  } catch (err) {
    console.error('更新字典类型失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.deleteType = async (req, res) => {
  try {
    const type = await SysDictType.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!type) return res.status(404).json({ code: 404, message: '字典类型不存在' });
    await type.update({ del_flag: 1, update_by: req.user.username });
    await SysDictData.update({ del_flag: 1 }, { where: { dict_type_code: type.dict_code } });
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除字典类型失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// ===== 字典数据 CRUD =====

exports.listData = async (req, res) => {
  try {
    const { dict_type_code, page = 1, pageSize = 100 } = req.query;
    if (!dict_type_code) return res.status(400).json({ code: 400, message: '请指定字典类型编码' });
    const where = { dict_type_code, del_flag: 0 };
    const { count, rows } = await SysDictData.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 200, data: { list: rows, total: count } });
  } catch (err) {
    console.error('字典数据列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.createData = async (req, res) => {
  try {
    const { dict_type_code, dict_label, dict_value, sort_order, remark, is_enabled } = req.body;
    if (!dict_type_code || !dict_label || dict_value === undefined) {
      return res.status(400).json({ code: 400, message: '类型编码、标签和值不能为空' });
    }
    const data = await SysDictData.create({
      dict_type_code, dict_label, dict_value,
      sort_order: sort_order || 0,
      is_enabled: is_enabled !== undefined ? is_enabled : 1,
      remark, create_by: req.user.username
    });
    res.json({ code: 200, message: '创建成功', data });
  } catch (err) {
    console.error('创建字典数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.updateData = async (req, res) => {
  try {
    const data = await SysDictData.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!data) return res.status(404).json({ code: 404, message: '字典数据不存在' });
    const { dict_label, dict_value, sort_order, is_enabled, remark } = req.body;
    await data.update({ dict_label, dict_value, sort_order, is_enabled, remark, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data });
  } catch (err) {
    console.error('更新字典数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const data = await SysDictData.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!data) return res.status(404).json({ code: 404, message: '字典数据不存在' });
    await data.update({ del_flag: 1, update_by: req.user.username });
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除字典数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 根据 dict_type_code 获取已启用的字典数据（供前端下拉使用）
exports.getDataByCode = async (req, res) => {
  try {
    const rows = await SysDictData.findAll({
      where: { dict_type_code: req.params.code, del_flag: 0, is_enabled: 1 },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error('获取字典数据失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
