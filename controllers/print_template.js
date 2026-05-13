const PrintTemplate = require('../models/print_template');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

exports.list = async (req, res) => {
  try {
    const rows = await PrintTemplate.findAll({
      where: { del_flag: 0 },
      order: [['id', 'ASC']]
    });
    return sendSuccess(res, { list: rows, total: rows.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('打印模板列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 获取指定页面下所有已启用模板（不暴露 api_url 和 token）
exports.byPage = async (req, res) => {
  try {
    const rows = await PrintTemplate.findAll({
      where: { page_code: req.params.pageCode, is_enabled: 1, del_flag: 0 },
      order: [['id', 'ASC']],
      attributes: ['id', 'template_name', 'output_format', 'business_param']
    });
    return sendSuccess(res, { list: rows, total: rows.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('获取页面打印模板失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    const { template_name, business_type, page_code, business_param, report_code, output_format, api_url, jimu_token, is_enabled } = req.body;
    const tmpl = await PrintTemplate.create({
      template_name, business_type,
      page_code: page_code || '',
      business_param: business_param || '',
      report_code,
      output_format: output_format || 'PDF',
      api_url,
      jimu_token: jimu_token || '',
      is_enabled: is_enabled !== undefined ? is_enabled : 1,
      create_by: req.user.username
    });
    return sendSuccess(res, tmpl, '创建成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建打印模板失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    const tmpl = await PrintTemplate.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!tmpl) throw new HttpError(404, '模板不存在');
    const { template_name, business_type, page_code, business_param, report_code, output_format, api_url, jimu_token, is_enabled } = req.body;
    await tmpl.update({
      template_name: template_name !== undefined ? template_name : tmpl.template_name,
      business_type: business_type !== undefined ? business_type : tmpl.business_type,
      page_code: page_code !== undefined ? page_code : tmpl.page_code,
      business_param: business_param !== undefined ? business_param : tmpl.business_param,
      report_code: report_code !== undefined ? report_code : tmpl.report_code,
      output_format: output_format !== undefined ? output_format : tmpl.output_format,
      api_url: api_url !== undefined ? api_url : tmpl.api_url,
      jimu_token: jimu_token !== undefined ? jimu_token : tmpl.jimu_token,
      is_enabled: is_enabled !== undefined ? is_enabled : tmpl.is_enabled,
      update_by: req.user.username
    });
    return sendSuccess(res, tmpl, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新打印模板失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    const tmpl = await PrintTemplate.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!tmpl) throw new HttpError(404, '模板不存在');
    await tmpl.update({ del_flag: 1, update_by: req.user.username });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('删除打印模板失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
