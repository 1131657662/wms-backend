const axios = require('axios');
const PrintTemplate = require('../models/print_template');

exports.print = async (req, res) => {
  try {
    const { businessType, businessId } = req.params;

    const tmpl = await PrintTemplate.findOne({
      where: { business_type: businessType, is_enabled: 1, del_flag: 0 },
      order: [['id', 'ASC']]
    });
    if (!tmpl) {
      return res.status(400).json({ code: 400, message: `未找到「${businessType}」的启用打印模板` });
    }

    // 构造积木报表新版 API 参数
    const exportType = (tmpl.output_format || 'PDF').toLowerCase();
    const exportParam = {
      reportId: tmpl.report_code,
      exportType: exportType,
      queryParam: { orderNo: businessId }
    };
    const exportParams = encodeURIComponent(JSON.stringify([exportParam]));

    // 构造 URL：baseUrl + token + exportParams
    let url = tmpl.api_url;
    const sep = url.includes('?') ? '&' : '?';
    if (tmpl.jimu_token) {
      url += `${sep}token=${encodeURIComponent(tmpl.jimu_token)}&exportParams=${exportParams}`;
    } else {
      url += `${sep}exportParams=${exportParams}`;
    }

    console.log('打印请求:', url);

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000
    });

    const contentType = exportType === 'pdf' ? 'application/pdf'
      : exportType === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream';
    const ext = exportType === 'excel' ? 'xlsx' : exportType;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${businessType}_${businessId}.${ext}"`);
    response.data.pipe(res);
  } catch (err) {
    console.error('打印请求失败:', err.message);
    if (err.response) {
      return res.status(err.response.status).json({ code: err.response.status, message: '积木报表请求失败' });
    }
    res.status(400).json({ code: 400, message: err.message || '打印请求失败' });
  }
};
