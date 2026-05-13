const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { listAll, saveOrder } = require('../services/menuSortService');

exports.list = async (req, res) => {
  try {
    const rows = await listAll();
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
    await saveOrder(items);
    return sendSuccess(res, null, '保存成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('保存菜单排序失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
