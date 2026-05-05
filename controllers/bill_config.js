const BillConfig = require('../models/bill_config');

exports.list = async (req, res) => {
  try {
    const rows = await BillConfig.findAll({
      where: { del_flag: 0 },
      order: [['id', 'ASC']]
    });
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error('单据配置列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const config = await BillConfig.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!config) return res.status(404).json({ code: 404, message: '单据配置不存在' });
    const { prefix, serial_digits, serial_start, is_enabled } = req.body;
    await config.update({
      prefix: prefix !== undefined ? prefix : config.prefix,
      serial_digits: serial_digits !== undefined ? serial_digits : config.serial_digits,
      serial_start: serial_start !== undefined ? serial_start : config.serial_start,
      is_enabled: is_enabled !== undefined ? is_enabled : config.is_enabled,
      update_by: req.user.username
    });
    res.json({ code: 200, message: '更新成功', data: config });
  } catch (err) {
    console.error('更新单据配置失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
