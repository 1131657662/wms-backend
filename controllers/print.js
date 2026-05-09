const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PrintTemplate = require('../models/print_template');

exports.print = async (req, res) => {
  try {
    const { templateId, businessId } = req.params;

    const tmpl = await PrintTemplate.findOne({
      where: { id: templateId, is_enabled: 1, del_flag: 0 }
    });
    if (!tmpl) {
      return res.status(400).json({ code: 400, message: '打印模板不存在或已禁用' });
    }

    // 构造积木报表新版 API 参数
    const exportType = (tmpl.output_format || 'PDF').toLowerCase();
    const exportParam = {
      reportId: tmpl.report_code,
      exportType: exportType,
      queryParam: { [tmpl.business_param || 'orderNo']: businessId }
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
    return res.json({ code: 200, data: { url: downloadUrl, fileName } });
  } catch (err) {
    console.error('打印请求失败:', err.message);
    if (err.response) {
      return res.status(err.response.status).json({ code: err.response.status, message: '积木报表请求失败' });
    }
    res.status(400).json({ code: 400, message: err.message || '打印请求失败' });
  }
};
