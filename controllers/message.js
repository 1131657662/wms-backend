const SysMessage = require('../models/sys_message');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

exports.list = async (req, res) => {
  try {
    const { type, is_read } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    where[Op.or] = [{ receiver_id: req.user.id }, { receiver_id: null }];
    if (type) where.type = type;
    if (is_read !== undefined && is_read !== '') where.is_read = Number(is_read);

    const { count, rows } = await SysMessage.findAndCountAll({
      where,
      order: [['create_time', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('消息列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const where = { del_flag: 0, is_read: 0 };
    where[Op.or] = [{ receiver_id: req.user.id }, { receiver_id: null }];
    const count = await SysMessage.count({ where });
    return sendSuccess(res, { count });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('未读消息数失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.markRead = async (req, res) => {
  try {
    const msg = await SysMessage.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!msg) throw new HttpError(404, '消息不存在');
    await msg.update({ is_read: 1 });
    return sendSuccess(res, null, '已标记为已读');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('标记已读失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const where = { del_flag: 0, is_read: 0 };
    where[Op.or] = [{ receiver_id: req.user.id }, { receiver_id: null }];
    await SysMessage.update({ is_read: 1 }, { where });
    return sendSuccess(res, null, '全部标记为已读');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('全部已读失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    const msg = await SysMessage.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!msg) throw new HttpError(404, '消息不存在');
    await msg.update({ del_flag: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('删除消息失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.send = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    if (!title) throw new HttpError(400, '消息标题不能为空');
    if (!content) throw new HttpError(400, '消息内容不能为空');
    if (!type) throw new HttpError(400, '消息类型不能为空');

    await SysMessage.create({
      title, content, type,
      receiver_id: null,  // null = 全员广播
      is_read: 0
    });

    return sendSuccess(res, null, '消息发送成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('发送消息失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0) throw new HttpError(400, '请选择消息');
    await SysMessage.update({ del_flag: 1 }, { where: { id: { [Op.in]: ids }, del_flag: 0 } });
    return sendSuccess(res, null, `已删除 ${ids.length} 条消息`);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('批量删除失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
