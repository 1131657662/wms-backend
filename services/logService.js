const SysOperationLog = require('../models/sys_operation_log');

module.exports = {
  async log({ userId, username, module, operation, operationDesc, businessType, businessId, requestUrl, method, params, ip, costTime, status, errorMsg }) {
    try {
      await SysOperationLog.create({
        user_id: userId || null,
        username: username || 'anonymous',
        module: module || '其他',
        operation: operation || '',
        operation_desc: operationDesc || null,
        business_type: businessType || null,
        business_id: businessId || null,
        request_url: requestUrl || null,
        method: method || null,
        params: params ? (typeof params === 'string' ? params.substring(0, 2000) : JSON.stringify(params).substring(0, 2000)) : null,
        ip: ip || null,
        cost_time: costTime || null,
        status: status !== undefined ? status : 1,
        error_msg: errorMsg || null
      });
    } catch (err) {
      console.error('日志写入失败:', err.message || err, err);
    }
  }
};
