const Product = require('../models/product');
const ProductCategory = require('../models/product_category');
const { Op } = require('sequelize');
const { sortSearchResults } = require('../utils/searchSort');
const ExcelJS = require('exceljs');
const multer = require('multer');
const logService = require('../services/logService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function throwIfProductDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  const paths = err.errors?.map(e => e.path).join(',') || '';
  const msg = err.errors?.map(e => e.message).join(',') || '';
  if (paths.includes('product_code') || msg.includes('product_code')) {
    throw new HttpError(400, '产品编码已存在，请重新填写');
  }
  if (paths.includes('product_model') || msg.includes('product_model')) {
    throw new HttpError(400, '产品型号已存在，请重新填写');
  }
  throw new HttpError(400, '数据重复');
}

exports.list = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${keyword}%` } },
        { product_name: { [Op.like]: `%${keyword}%` } },
        { product_model: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('商品列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 供前端远程搜索
exports.search = async (req, res) => {
  try {
    const { keyword } = req.query;
    const limit = clampPageSize(req.query.pageSize, 500, 1000);
    const where = { del_flag: 0, status: '正常' };
    if (keyword) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${keyword}%` } },
        { product_name: { [Op.like]: `%${keyword}%` } },
        { product_model: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Product.findAll({ where, limit, raw: true });
    const sorted = sortSearchResults(
      rows,
      keyword,
      r => r.product_code,
      [r => r.product_code, r => r.product_name, r => r.product_model]
    );
    return sendSuccess(res, { list: sorted, total: sorted.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Product.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '商品不存在');
    return sendSuccess(res, item);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

/**
 * 物理清除与指定编码/型号冲突的软删除记录。
 * MySQL 唯一索引对软删除行（del_flag=1）依然生效，新增/更新前必须先释放占用。
 */
async function clearSoftDeletedConflicts({ product_code, product_model }) {
  const or = [];
  if (product_code) or.push({ product_code });
  if (product_model) or.push({ product_model });
  if (or.length === 0) return;
  await Product.destroy({ where: { del_flag: 1, [Op.or]: or }, force: true });
}

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(req.body);
    const item = await Product.create({ ...req.body, create_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建商品', operationDesc: `创建商品「${item.product_code} ${item.product_name}」`, businessType: 'product', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfProductDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建商品失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await Product.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '商品不存在');
    await clearSoftDeletedConflicts(req.body);
    await item.update({ ...req.body, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑商品', operationDesc: `编辑商品「${item.product_code} ${item.product_name}」`, businessType: 'product', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfProductDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新商品失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await Product.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '商品不存在');
    await item.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除商品', operationDesc: `删除商品「${item.product_code} ${item.product_name}」`, businessType: 'product', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportProducts = async (req, res) => {
  try {
    const { keyword, category_id } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${keyword}%` } },
        { product_name: { [Op.like]: `%${keyword}%` } },
        { product_model: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (category_id) where.category_id = category_id;

    const rows = await Product.findAll({ where, order: [['id', 'DESC']] });

    const categoryIds = [...new Set(rows.map(r => r.category_id).filter(Boolean))];
    const categoryMap = {};
    if (categoryIds.length > 0) {
      const cats = await ProductCategory.findAll({ where: { id: { [Op.in]: categoryIds }, del_flag: 0 }, raw: true });
      cats.forEach(c => { categoryMap[c.id] = c.category_name; });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('商品数据');
    sheet.columns = [
      { header: '商品编码', key: 'product_code', width: 15 },
      { header: '商品名称', key: 'product_name', width: 20 },
      { header: '型号', key: 'product_model', width: 20 },
      { header: '分类', key: 'category_name', width: 15 },
      { header: '计数单位', key: 'count_unit', width: 10 },
      { header: '重量单位', key: 'weight_unit', width: 10 },
      { header: '包装类型', key: 'package_type', width: 12 },
      { header: '包装颜色', key: 'package_color', width: 12 },
      { header: '带颜色', key: 'strap_color', width: 12 },
      { header: '销售价', key: 'sale_price', width: 10 },
      { header: '成本价', key: 'cost_price', width: 10 },
      { header: '最低预警重量', key: 'default_min_alert_weight', width: 14 },
      { header: '最高预警重量', key: 'default_max_alert_weight', width: 14 },
      { header: '状态', key: 'status', width: 8 },
      { header: '备注', key: 'remark', width: 30 }
    ];

    rows.forEach(r => {
      sheet.addRow({
        product_code: r.product_code,
        product_name: r.product_name,
        product_model: r.product_model,
        category_name: categoryMap[r.category_id] || '',
        count_unit: r.count_unit,
        weight_unit: r.weight_unit,
        package_type: r.package_type,
        package_color: r.package_color,
        strap_color: r.strap_color,
        sale_price: r.sale_price ? Number(r.sale_price) : '',
        cost_price: r.cost_price ? Number(r.cost_price) : '',
        default_min_alert_weight: r.default_min_alert_weight ? Number(r.default_min_alert_weight) : '',
        default_max_alert_weight: r.default_max_alert_weight ? Number(r.default_max_alert_weight) : '',
        status: r.status,
        remark: r.remark
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_export.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('商品导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('商品导入模板');
    sheet.columns = [
      { header: '商品编码', key: 'product_code', width: 15 },
      { header: '商品名称', key: 'product_name', width: 20 },
      { header: '型号', key: 'product_model', width: 20 },
      { header: '分类名称', key: 'category_name', width: 15 },
      { header: '计数单位', key: 'count_unit', width: 10 },
      { header: '重量单位', key: 'weight_unit', width: 10 },
      { header: '包装类型', key: 'package_type', width: 12 },
      { header: '包装颜色', key: 'package_color', width: 12 },
      { header: '带颜色', key: 'strap_color', width: 12 },
      { header: '销售价', key: 'sale_price', width: 10 },
      { header: '成本价', key: 'cost_price', width: 10 },
      { header: '最低预警重量', key: 'default_min_alert_weight', width: 14 },
      { header: '最高预警重量', key: 'default_max_alert_weight', width: 14 },
      { header: '状态', key: 'status', width: 8 },
      { header: '备注', key: 'remark', width: 30 }
    ];
    sheet.addRow({ product_code: 'P001', product_name: '示例商品', product_model: 'M001', category_name: '', count_unit: '件', weight_unit: '吨', package_type: '', package_color: '', strap_color: '', sale_price: '', cost_price: '', default_min_alert_weight: 20, default_max_alert_weight: 200, status: '正常', remark: '' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('模板下载失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.importProducts = [upload.single('file'), async (req, res) => {
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
          product_code: String(vals[1] || '').trim(),
          product_name: String(vals[2] || '').trim(),
          product_model: String(vals[3] || '').trim(),
          category_name: String(vals[4] || '').trim(),
          count_unit: String(vals[5] || '').trim(),
          weight_unit: String(vals[6] || '').trim(),
          package_type: String(vals[7] || '').trim(),
          package_color: String(vals[8] || '').trim(),
          strap_color: String(vals[9] || '').trim(),
          sale_price: vals[10],
          cost_price: vals[11],
          default_min_alert_weight: vals[12],
          default_max_alert_weight: vals[13],
          status: String(vals[14] || '').trim() || '正常',
          remark: String(vals[15] || '').trim()
        });
      }
    });

    if (rows.length === 0) throw new HttpError(400, 'Excel 文件中无数据行');

    const allCats = await ProductCategory.findAll({ where: { del_flag: 0 }, raw: true });
    const categoryMap = {};
    allCats.forEach(c => { categoryMap[c.category_name] = c.id; });

    // 软删除记录依然占用唯一索引，导入前先物理清除，释放编码/型号
    const deletedCount = await Product.destroy({ where: { del_flag: 1 }, force: true });
    if (deletedCount > 0) console.log(`[导入] 已物理清除 ${deletedCount} 条软删除产品，释放编码占用`);

    const existingCodes = new Set((await Product.findAll({ attributes: ['product_code'], where: { del_flag: 0 }, raw: true })).map(p => p.product_code.toLowerCase()));
    const existingModels = new Set((await Product.findAll({ attributes: ['product_model'], where: { product_model: { [Op.ne]: null }, del_flag: 0 }, raw: true })).map(p => p.product_model.toLowerCase()));

    const errors = [];
    const toCreate = [];
    const validStatuses = ['正常', '停用'];
    const seenCodes = new Set();
    const seenModels = new Set();

    for (const r of rows) {
      const rowErr = [];
      const codeLower = r.product_code.toLowerCase();
      if (!r.product_code) {
        rowErr.push('商品编码不能为空');
      } else if (seenCodes.has(codeLower)) {
        rowErr.push(`商品编码「${r.product_code}」在导入文件中重复（第 ${r.rowNumber} 行）`);
      } else if (existingCodes.has(codeLower)) {
        rowErr.push(`商品编码「${r.product_code}」已存在`);
      } else {
        seenCodes.add(codeLower);
      }
      if (!r.product_name) rowErr.push('商品名称不能为空');
      if (r.product_model) {
        const modelLower = r.product_model.toLowerCase();
        if (seenModels.has(modelLower)) {
          rowErr.push(`型号「${r.product_model}」在导入文件中重复（第 ${r.rowNumber} 行）`);
        } else if (existingModels.has(modelLower)) {
          rowErr.push(`型号「${r.product_model}」已存在`);
        } else {
          seenModels.add(modelLower);
        }
      }
      if (r.sale_price && (isNaN(Number(r.sale_price)) || Number(r.sale_price) < 0)) rowErr.push('销售价需为非负数字');
      if (r.cost_price && (isNaN(Number(r.cost_price)) || Number(r.cost_price) < 0)) rowErr.push('成本价需为非负数字');
      if (r.default_min_alert_weight && (isNaN(Number(r.default_min_alert_weight)) || Number(r.default_min_alert_weight) < 0)) rowErr.push('最低预警重量需为非负数字');
      if (r.default_max_alert_weight && (isNaN(Number(r.default_max_alert_weight)) || Number(r.default_max_alert_weight) < 0)) rowErr.push('最高预警重量需为非负数字');
      if (r.category_name && !categoryMap[r.category_name]) rowErr.push(`分类「${r.category_name}」不存在`);
      if (r.status && !validStatuses.includes(r.status)) rowErr.push(`状态「${r.status}」无效，应为"正常"或"停用"`);

      if (rowErr.length > 0) {
        errors.push({ row: r.rowNumber, errors: rowErr });
      } else {
        toCreate.push({
          product_code: r.product_code, product_name: r.product_name, product_model: r.product_model || null,
          category_id: r.category_name ? categoryMap[r.category_name] : null,
          count_unit: r.count_unit || null, weight_unit: r.weight_unit || null,
          package_type: r.package_type || null, package_color: r.package_color || null,
          strap_color: r.strap_color || null,
          sale_price: r.sale_price ? Number(r.sale_price) : null,
          cost_price: r.cost_price ? Number(r.cost_price) : null,
          default_min_alert_weight: r.default_min_alert_weight ? Number(r.default_min_alert_weight) : null,
          default_max_alert_weight: r.default_max_alert_weight ? Number(r.default_max_alert_weight) : null,
          status: r.status || '正常', remark: r.remark || null,
          create_by: req.user.username
        });
      }
    }

    let successCount = 0;
    if (toCreate.length > 0) {
      try {
        await Product.bulkCreate(toCreate);
        successCount = toCreate.length;
      } catch (e) {
        console.error('批量创建商品失败:', e);
        const detail = e.errors?.map(err => `${err.path}: ${err.message}`).join('; ') || e.message;
        throw new HttpError(500, `批量创建失败: ${detail}`, { expose: true });
      }
    }

    if (successCount > 0) {
      logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '导入商品', operationDesc: `批量导入商品，成功 ${successCount} 条，失败 ${errors.length} 条`, businessType: 'product', method: 'POST', ip: req.ip, status: 1 });
    }
    return sendSuccess(
      res,
      { successCount, failCount: errors.length, errors },
      `成功导入 ${successCount} 条，失败 ${errors.length} 条`
    );
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('商品导入失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
}];
