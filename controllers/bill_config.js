const BillConfig = require('../models/bill_config');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

exports.list = async (req, res) => {
  try {
    const rows = await BillConfig.findAll({
      where: { del_flag: 0 },
      order: [['id', 'ASC']]
    });
    return sendSuccess(res, rows);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('单据配置列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    const config = await BillConfig.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!config) throw new HttpError(404, '单据配置不存在');
    const { prefix, serial_digits, serial_start, is_enabled } = req.body;
    await config.update({
      prefix: prefix !== undefined ? prefix : config.prefix,
      serial_digits: serial_digits !== undefined ? serial_digits : config.serial_digits,
      serial_start: serial_start !== undefined ? serial_start : config.serial_start,
      is_enabled: is_enabled !== undefined ? is_enabled : config.is_enabled,
      update_by: req.user.username
    });
    return sendSuccess(res, config, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新单据配置失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};