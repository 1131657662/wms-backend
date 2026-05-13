const Customer = require('../models/customer');
const { Op } = require('sequelize');
const { sortSearchResults } = require('../utils/searchSort');
const { generateBillNo } = require('../utils/bill_no');
const logService = require('../services/logService');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');
const ExcelJS = require('exceljs');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function throwIfCustomerDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  const paths = err.errors?.map(e => e.path).join(',') || '';
  const msg = err.errors?.map(e => e.message).join(',') || '';
  if (paths.includes('customer_code') || msg.includes('customer_code')) {
    throw new HttpError(400, '客户编码已存在');
  }
  if (paths.includes('customer_name') || msg.includes('customer_name')) {
    throw new HttpError(400, '客户名称已存在');
  }
  throw new HttpError(400, '数据重复');
}

exports.search = async (req, res) => {
  try {
    const { keyword } = req.query;
    const limit = clampPageSize(req.query.pageSize, 500, 1000);
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${keyword}%` } },
        { customer_name: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } },
        { contact_person: { [Op.like]: `%${keyword}%` } },
        { contact_phone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Customer.findAll({ where, limit, raw: true });
    const sorted = sortSearchResults(
      rows,
      keyword,
      r => r.customer_code,
      [
        r => r.customer_code,
        r => r.customer_name,
        r => r.address,
        r => r.contact_person,
        r => r.contact_phone
      ]
    );
    return sendSuccess(res, sorted);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('搜索客户失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

const SUGGEST_FIELD_MAP = {
  name: 'customer_name',
  address: 'address',
  contact_person: 'contact_person',
  contact_phone: 'contact_phone',
  code: 'customer_code'
};

/** GET /api/customer/suggest — 单字段模糊联想（新增客户表单） */
exports.suggest = async (req, res) => {
  try {
    const field = String(req.query.field || 'name');
    const col = SUGGEST_FIELD_MAP[field];
    if (!col) {
      throw new HttpError(400, 'field 须为 name|address|contact_person|contact_phone|code');
    }
    const q = String(req.query.q || '').trim();
    if (q.length < 1) return sendSuccess(res, []);
    const lim = clampPageSize(req.query.limit, 30, 100);
    const rows = await Customer.findAll({
      where: { del_flag: 0, [col]: { [Op.like]: `%${q}%` } },
      attributes: ['id', 'customer_code', 'customer_name', 'address', 'contact_person', 'contact_phone'],
      limit: Math.min(lim * 5, 500),
      raw: true
    });
    const sorted = sortSearchResults(
      rows,
      q,
      r => String(r[col] ?? ''),
      [r => String(r[col] ?? '')]
    );
    return sendSuccess(res, sorted.slice(0, lim));
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('客户联想失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.list = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${keyword}%` } },
        { customer_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('客户列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Customer.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '客户不存在');
    return sendSuccess(res, item);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Customer, req.body, ['customer_code', 'customer_name']);
    const customer_code = await generateBillNo('customer_code');
    const item = await Customer.create({ ...req.body, customer_code, create_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建客户', operationDesc: `创建客户「${customer_code} ${item.customer_name}」`, businessType: 'customer', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfCustomerDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建客户失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Customer, req.body, ['customer_code', 'customer_name']);
    const item = await Customer.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '客户不存在');
    await item.update({ ...req.body, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑客户', operationDesc: `编辑客户「${item.customer_code} ${item.customer_name}」`, businessType: 'customer', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfCustomerDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新客户失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await Customer.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '客户不存在');
    await item.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除客户', operationDesc: `删除客户「${item.customer_code} ${item.customer_name}」`, businessType: 'customer', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportCustomers = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${keyword}%` } },
        { customer_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Customer.findAll({ where, order: [['id', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('客户数据');
    sheet.columns = [
      { header: '客户编码', key: 'customer_code', width: 16 },
      { header: '客户名称', key: 'customer_name', width: 22 },
      { header: '地址', key: 'address', width: 30 },
      { header: '联系人', key: 'contact_person', width: 12 },
      { header: '联系电话', key: 'contact_phone', width: 16 },
      { header: '信用额度', key: 'credit_limit', width: 14 },
      { header: '等级', key: 'customer_level', width: 8 }
    ];

    rows.forEach(r => {
      sheet.addRow({
        customer_code: r.customer_code,
        customer_name: r.customer_name,
        address: r.address || '',
        contact_person: r.contact_person || '',
        contact_phone: r.contact_phone || '',
        credit_limit: r.credit_limit ? Number(r.credit_limit) : '',
        customer_level: r.customer_level || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_export.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('客户导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('客户导入模板');
    sheet.columns = [
      { header: '客户名称', key: 'customer_name', width: 22 },
      { header: '地址', key: 'address', width: 30 },
      { header: '联系人', key: 'contact_person', width: 12 },
      { header: '联系电话', key: 'contact_phone', width: 16 },
      { header: '信用额度', key: 'credit_limit', width: 14 },
      { header: '等级', key: 'customer_level', width: 8 }
    ];
    sheet.addRow({
      customer_name: '示例客户有限公司',
      address: '广东省广州市XX区XX路100号',
      contact_person: '张三',
      contact_phone: '13800138000',
      credit_limit: 50000,
      customer_level: 'A'
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_import_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('模板下载失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.importCustomers = [upload.single('file'), async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可导入');

    const file = req.file;
    if (!file) throw new HttpError(400, '请上传 Excel 文件');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new HttpError(400, 'Excel 文件为空');

    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const vals = row.values;
        rows.push({
          rowNumber,
          customer_name: String(vals[1] || '').trim(),
          address: String(vals[2] || '').trim(),
          contact_person: String(vals[3] || '').trim(),
          contact_phone: String(vals[4] || '').trim(),
          credit_limit: vals[5],
          customer_level: String(vals[6] || '').trim().toUpperCase()
        });
      }
    });

    if (rows.length === 0) throw new HttpError(400, 'Excel 文件中无数据行');

    // 物理清除软删除记录，释放名称占用
    const deletedCount = await Customer.destroy({ where: { del_flag: 1 }, force: true });
    if (deletedCount > 0) console.log(`[导入] 已物理清除 ${deletedCount} 条软删除客户，释放名称占用`);

    const existingNames = new Set((await Customer.findAll({ attributes: ['customer_name'], where: { del_flag: 0 }, raw: true })).map(c => c.customer_name.toLowerCase()));

    const validLevels = ['A', 'B', 'C'];
    const errors = [];
    const toCreate = [];
    const seenNames = new Set();

    for (const r of rows) {
      const rowErr = [];
      const nameLower = r.customer_name.toLowerCase();
      if (!r.customer_name) {
        rowErr.push('客户名称不能为空');
      } else if (seenNames.has(nameLower)) {
        rowErr.push(`客户名称「${r.customer_name}」在导入文件中重复（第 ${r.rowNumber} 行）`);
      } else if (existingNames.has(nameLower)) {
        rowErr.push(`客户名称「${r.customer_name}」已存在`);
      } else {
        seenNames.add(nameLower);
      }
      if (r.credit_limit && (isNaN(Number(r.credit_limit)) || Number(r.credit_limit) < 0)) rowErr.push('信用额度需为非负数字');
      if (r.customer_level && !validLevels.includes(r.customer_level)) rowErr.push(`等级「${r.customer_level}」无效，应为 A/B/C`);

      if (rowErr.length > 0) {
        errors.push({ row: r.rowNumber, errors: rowErr });
      } else {
        toCreate.push({
          customer_name: r.customer_name,
          address: r.address || null,
          contact_person: r.contact_person || null,
          contact_phone: r.contact_phone || null,
          credit_limit: r.credit_limit ? Number(r.credit_limit) : null,
          customer_level: r.customer_level || 'A',
          create_by: req.user.username
        });
      }
    }

    let successCount = 0;
    if (toCreate.length > 0) {
      for (const item of toCreate) {
        try {
          const customer_code = await generateBillNo('customer_code');
          await Customer.create({ ...item, customer_code });
          successCount++;
        } catch (e) {
          if (e.name === 'SequelizeUniqueConstraintError') {
            errors.push({ row: -1, errors: [`客户名称「${item.customer_name}」编码冲突`] });
          } else {
            throw e;
          }
        }
      }
    }

    if (successCount > 0) {
      logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '导入客户', operationDesc: `批量导入客户，成功 ${successCount} 条，失败 ${errors.length} 条`, businessType: 'customer', method: 'POST', ip: req.ip, status: 1 });
    }
    return sendSuccess(
      res,
      { successCount, failCount: errors.length, errors },
      `成功导入 ${successCount} 条，失败 ${errors.length} 条`
    );
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('客户导入失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
}];
