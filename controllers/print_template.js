const PrintTemplate = require('../models/print_template');

exports.list = async (req, res) => {
  try {
    const rows = await PrintTemplate.findAll({
      where: { del_flag: 0 },
      order: [['id', 'ASC']]
    });
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error('打印模板列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const { template_name, business_type, report_code, output_format, api_url, jimu_token, is_enabled } = req.body;
    const tmpl = await PrintTemplate.create({
      template_name, business_type, report_code,
      output_format: output_format || 'PDF',
      api_url,
      jimu_token: jimu_token || '',
      is_enabled: is_enabled !== undefined ? is_enabled : 1,
      create_by: req.user.username
    });
    res.json({ code: 200, message: '创建成功', data: tmpl });
  } catch (err) {
    console.error('创建打印模板失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const tmpl = await PrintTemplate.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!tmpl) return res.status(404).json({ code: 404, message: '模板不存在' });
    const { template_name, business_type, report_code, output_format, api_url, jimu_token, is_enabled } = req.body;
    await tmpl.update({
      template_name: template_name !== undefined ? template_name : tmpl.template_name,
      business_type: business_type !== undefined ? business_type : tmpl.business_type,
      report_code: report_code !== undefined ? report_code : tmpl.report_code,
      output_format: output_format !== undefined ? output_format : tmpl.output_format,
      api_url: api_url !== undefined ? api_url : tmpl.api_url,
      jimu_token: jimu_token !== undefined ? jimu_token : tmpl.jimu_token,
      is_enabled: is_enabled !== undefined ? is_enabled : tmpl.is_enabled,
      update_by: req.user.username
    });
    res.json({ code: 200, message: '更新成功', data: tmpl });
  } catch (err) {
    console.error('更新打印模板失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const tmpl = await PrintTemplate.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!tmpl) return res.status(404).json({ code: 404, message: '模板不存在' });
    await tmpl.update({ del_flag: 1, update_by: req.user.username });
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除打印模板失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
