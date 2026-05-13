const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PrintTemplate = require('../models/print_template');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

exports.print = async (req, res) => {
  try {
    const { templateId, businessId } = req.params;

    const tmpl = await PrintTemplate.findOne({
      where: { id: templateId, is_enabled: 1, del_flag: 0 }
    });
    if (!tmpl) {
      throw new HttpError(400, '打印模板不存在或已禁用');
    }

    // 构造积木报表新版 API 参数
    const exportType = (tmpl.output_format || 'PDF').toLowerCase();
    // 迁移脚本曾把 business_param 误设为 inbound/outbound；积木侧通常用 orderNo
    let paramKey = (tmpl.business_param || '').trim();
    if (!paramKey || paramKey === 'inbound' || paramKey === 'outbound') {
      paramKey = 'orderNo';
    }
    // 与 Node axios 调用积木时，多数版本接受 queryParam 为对象；若报表无数据再排查单号/参数名
    const exportParam = {
      reportId: tmpl.report_code,
      exportType: exportType,
      queryParam: { [paramKey]: String(businessId) }
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

    // 保存到临时目录
    const tempDir = path.join(__dirname, '../public/temp/print');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const ext = exportType === 'excel' ? 'xlsx' : exportType;
    const fileName = `print_${templateId}_${businessId}_${Date.now()}.${ext}`;
    const filePath = path.join(tempDir, fileName);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });

    const downloadUrl = `/public/temp/print/${fileName}`;
    return sendSuccess(res, { url: downloadUrl, fileName });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('打印请求失败:', err.message);
    if (err.response) {
      const st = Number(err.response.status) || 502;
      const code = st >= 400 && st < 600 ? st : 502;
      throw new HttpError(code, '积木报表请求失败', { expose: true });
    }
    throw new HttpError(502, '打印请求失败，请稍后重试', { expose: true });
  }
};
