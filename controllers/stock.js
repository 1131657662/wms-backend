const Stock = require('../models/stock');
const StockJournal = require('../models/stock_journal');
const Warehouse = require('../models/warehouse');
const Product = require('../models/product');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const multer = require('multer');
const logService = require('../services/logService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

exports.list = async (req, res) => {
  try {
    const { keyword, warehouse_code, product_code, product_name, product_model, alert } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };

    if (keyword) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${keyword}%` } },
        { product_name: { [Op.like]: `%${keyword}%` } },
        { product_model: { [Op.like]: `%${keyword}%` } },
        { warehouse_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (warehouse_code) where.warehouse_code = warehouse_code;
    if (product_code) where.product_code = product_code;
    if (product_name) where.product_name = { [Op.like]: `%${product_name}%` };
    if (product_model) where.product_model = { [Op.like]: `%${product_model}%` };
    if (alert === 'zero') {
      where.stock_qty = 0;
    } else if (alert === 'low') {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        { stock_qty: { [Op.gt]: 0 } },
        { min_alert_weight: { [Op.ne]: null } },
        { stock_weight: { [Op.lt]: Stock.sequelize.col('min_alert_weight') } }
      );
    } else if (alert === 'high') {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        { stock_qty: { [Op.gt]: 0 } },
        { max_alert_weight: { [Op.ne]: null } },
        { stock_weight: { [Op.gt]: Stock.sequelize.col('max_alert_weight') } }
      );
    } else if (alert === 'normal') {
      where.stock_qty = { [Op.gt]: 0 };
      where[Op.or] = [
        { min_alert_weight: null, max_alert_weight: null },
        { stock_weight: { [Op.and]: [{ [Op.gte]: Stock.sequelize.col('min_alert_weight') }, { [Op.lte]: Stock.sequelize.col('max_alert_weight') }] } }
      ];
    } else {
      where.stock_qty = { [Op.gt]: 0 };
    }

    const { count, rows } = await Stock.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    const stock = await Stock.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!stock) throw new HttpError(404, '库存记录不存在');
    const { min_alert_weight, max_alert_weight } = req.body;
    await stock.update({
      min_alert_weight: min_alert_weight !== undefined ? min_alert_weight : stock.min_alert_weight,
      max_alert_weight: max_alert_weight !== undefined ? max_alert_weight : stock.max_alert_weight,
      update_by: req.user.username
    });
    return sendSuccess(res, stock, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新库存预警失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 直接调整库存
exports.adjust = async (req, res) => {
  try {
    const stock = await Stock.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!stock) throw new HttpError(404, '库存记录不存在');

    const { change_qty, change_weight, remark } = req.body;
    if (change_qty == null && change_weight == null) {
      throw new HttpError(400, '请填写调整件数或调整吨位');
    }

    const dQty = Number(change_qty) || 0;
    const dWeight = Number(change_weight) || 0;
    const beforeQty = stock.stock_qty;
    const beforeWeight = Number(stock.stock_weight);
    const afterQty = beforeQty + dQty;
    const afterWeight = beforeWeight + dWeight;

    if (afterQty < 0) {
      throw new HttpError(400, '调整后件数不能为负数');
    }
    if (afterWeight < 0) {
      throw new HttpError(400, '调整后吨位不能为负数');
    }

    await stock.update({
      stock_qty: afterQty,
      stock_weight: afterWeight,
      update_by: req.user.username
    });

    await StockJournal.create({
      warehouse_code: stock.warehouse_code,
      warehouse_name: stock.warehouse_name,
      product_code: stock.product_code,
      product_name: stock.product_name,
      product_model: stock.product_model,
      business_type: 'adjust',
      order_no: 'ADJUST',
      change_qty: dQty,
      change_weight: dWeight,
      before_qty: beforeQty,
      before_weight: beforeWeight,
      after_qty: afterQty,
      after_weight: afterWeight,
      remark: remark || '手动调整库存',
      create_by: req.user.username
    });

    return sendSuccess(res, stock, '库存调整成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存调整失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportStock = async (req, res) => {
  try {
    const { keyword, warehouse_code, product_code, alert } = req.query;
    const where = { del_flag: 0 };

    if (keyword) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${keyword}%` } },
        { product_name: { [Op.like]: `%${keyword}%` } },
        { product_model: { [Op.like]: `%${keyword}%` } },
        { warehouse_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (warehouse_code) where.warehouse_code = warehouse_code;
    if (product_code) where.product_code = { [Op.like]: `%${product_code}%` };

    const rows = await Stock.findAll({ where, order: [['id', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('库存数据');
    sheet.columns = [
      { header: '仓库编码', key: 'warehouse_code', width: 15 },
      { header: '仓库名称', key: 'warehouse_name', width: 15 },
      { header: '产品编码', key: 'product_code', width: 15 },
      { header: '产品名称', key: 'product_name', width: 20 },
      { header: '产品型号', key: 'product_model', width: 20 },
      { header: '库存件数', key: 'stock_qty', width: 12 },
      { header: '库存吨位', key: 'stock_weight', width: 12 },
      { header: '预警下限', key: 'min_alert_weight', width: 12 },
      { header: '预警上限', key: 'max_alert_weight', width: 12 }
    ];

    rows.forEach(r => {
      sheet.addRow({
        warehouse_code: r.warehouse_code,
        warehouse_name: r.warehouse_name,
        product_code: r.product_code,
        product_name: r.product_name,
        product_model: r.product_model,
        stock_qty: r.stock_qty,
        stock_weight: Number(r.stock_weight),
        min_alert_weight: r.min_alert_weight ? Number(r.min_alert_weight) : '',
        max_alert_weight: r.max_alert_weight ? Number(r.max_alert_weight) : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock_export.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.check = async (req, res) => {
  try {
    const { warehouse_code, product_code } = req.query;
    if (!warehouse_code || !product_code) {
      throw new HttpError(400, '缺少仓库或产品参数');
    }
    const stock = await Stock.findOne({
      attributes: ['stock_qty', 'stock_weight'],
      where: { warehouse_code, product_code, del_flag: 0 }
    });
    return sendSuccess(res, { stock_qty: stock?.stock_qty || 0, stock_weight: Number(stock?.stock_weight) || 0 });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存校验失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 清除零库存记录
exports.clearZeroStock = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');

    const [count] = await Stock.update(
      { del_flag: 1, update_by: req.user.username },
      { where: { del_flag: 0, stock_qty: 0, stock_weight: 0 } }
    );

    if (count > 0) {
      logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '清除零库存', operationDesc: `清除零库存记录 ${count} 条`, businessType: 'stock', method: 'POST', ip: req.ip, status: 1 });
    }
    return sendSuccess(res, { deleted: count }, `已清除 ${count} 条零库存记录`);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('清除零库存失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 从流水重建库存（物化视图重建）
exports.rebuildFromJournals = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');

    // 软删除所有现有库存（先保留以便回滚）
    const [existingCount] = await Stock.update(
      { del_flag: 1, update_by: req.user.username },
      { where: { del_flag: 0 } }
    );

    // 从 stock_journal 聚合：SUM(change_qty) GROUP BY warehouse_code + product_code
    // 使用 raw query 避免 ONLY_FULL_GROUP_BY 问题
    const journals = await StockJournal.sequelize.query(
      `SELECT warehouse_code, MAX(warehouse_name) AS warehouse_name,
              product_code, MAX(product_name) AS product_name, MAX(product_model) AS product_model,
              SUM(change_qty) AS total_qty, SUM(change_weight) AS total_weight
       FROM stock_journal
       WHERE del_flag = 0
       GROUP BY warehouse_code, product_code`,
      { type: StockJournal.sequelize.QueryTypes.SELECT }
    );

    let createdCount = 0;
    for (const j of journals) {
      if (Number(j.total_qty) === 0 && Number(j.total_weight) === 0) continue;

      // 查找已有记录（含软删除），复用或新建
      const existing = await Stock.findOne({
        where: { warehouse_code: j.warehouse_code, product_code: j.product_code, del_flag: 1 }
      });
      if (existing) {
        await existing.update({
          warehouse_name: j.warehouse_name,
          product_name: j.product_name,
          product_model: j.product_model,
          stock_qty: Number(j.total_qty),
          stock_weight: Number(j.total_weight),
          del_flag: 0,
          update_by: req.user.username
        });
      } else {
        await Stock.create({
          warehouse_code: j.warehouse_code,
          warehouse_name: j.warehouse_name,
          product_code: j.product_code,
          product_name: j.product_name,
          product_model: j.product_model,
          stock_qty: Number(j.total_qty),
          stock_weight: Number(j.total_weight),
          del_flag: 0,
          create_by: req.user.username,
          update_by: req.user.username
        });
      }
      createdCount++;
    }

    logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '重建库存', operationDesc: `从流水重建库存，生成 ${createdCount} 条`, businessType: 'stock', method: 'POST', ip: req.ip, status: 1 });
    return sendSuccess(
      res,
      { previousCount: existingCount, rebuiltCount: createdCount },
      `库存重建完成：从流水聚合生成 ${createdCount} 条记录，原有 ${existingCount} 条记录中无流水的孤儿已被清除`
    );
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('重建库存失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 重置期初库存：清除所有导入数据和库存记录，允许重新导入
exports.resetStock = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可操作');

    const [journalCount] = await StockJournal.update(
      { del_flag: 1, update_by: req.user.username },
      { where: { business_type: 'import', del_flag: 0 } }
    );
    const [stockCount] = await Stock.update(
      { del_flag: 1, update_by: req.user.username },
      { where: { del_flag: 0 } }
    );

    logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '重置库存', operationDesc: `清除 ${stockCount} 条库存和 ${journalCount} 条导入流水`, businessType: 'stock', method: 'POST', ip: req.ip, status: 1 });
    return sendSuccess(
      res,
      { stockDeleted: stockCount, journalDeleted: journalCount },
      `已清除 ${stockCount} 条库存记录和 ${journalCount} 条导入流水，可重新导入期初库存`
    );
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('重置库存失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 仓库维度库存概览
exports.warehouseSummary = async (req, res) => {
  try {
    const rows = await Stock.sequelize.query(
      `SELECT warehouse_code, MAX(warehouse_name) AS warehouse_name,
              SUM(stock_qty) AS total_qty, SUM(stock_weight) AS total_weight,
              COUNT(*) AS sku_count
       FROM stock
       WHERE del_flag = 0 AND stock_qty > 0
       GROUP BY warehouse_code
       ORDER BY total_weight DESC`,
      { type: Stock.sequelize.QueryTypes.SELECT }
    );
    return sendSuccess(res, rows);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('仓库库存概览失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.journalList = async (req, res) => {
  try {
    const { product_code, warehouse_code, business_type, startDate, endDate } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };

    if (product_code) where.product_code = { [Op.like]: `%${product_code}%` };
    if (warehouse_code) where.warehouse_code = warehouse_code;
    if (business_type) where.business_type = business_type;
    if (startDate && endDate) {
      where.create_time = { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] };
    }

    const { count, rows } = await StockJournal.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存流水失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportJournal = async (req, res) => {
  try {
    const { product_code, warehouse_code, business_type, startDate, endDate } = req.query;
    const where = { del_flag: 0 };
    if (product_code) where.product_code = { [Op.like]: `%${product_code}%` };
    if (warehouse_code) where.warehouse_code = warehouse_code;
    if (business_type) where.business_type = business_type;
    if (startDate && endDate) {
      where.create_time = { [Op.between]: [startDate + ' 00:00:00', endDate + ' 23:59:59'] };
    }

    const rows = await StockJournal.findAll({ where, order: [['id', 'DESC']], limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('库存流水');
    sheet.columns = [
      { header: '商品编码', key: 'product_code', width: 15 },
      { header: '商品名称', key: 'product_name', width: 20 },
      { header: '型号', key: 'product_model', width: 15 },
      { header: '仓库', key: 'warehouse_name', width: 15 },
      { header: '业务类型', key: 'business_type', width: 10 },
      { header: '单号', key: 'order_no', width: 22 },
      { header: '变化件数', key: 'change_qty', width: 10 },
      { header: '变化吨位', key: 'change_weight', width: 12 },
      { header: '变更前件数', key: 'before_qty', width: 12 },
      { header: '变更前吨位', key: 'before_weight', width: 12 },
      { header: '变更后件数', key: 'after_qty', width: 12 },
      { header: '变更后吨位', key: 'after_weight', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '操作时间', key: 'create_time', width: 20 }
    ];

    const bizTypeMap = { inbound: '入库', outbound: '出库', check: '盘点', init: '初始化' };
    rows.forEach(r => {
      sheet.addRow({
        product_code: r.product_code,
        product_name: r.product_name,
        product_model: r.product_model,
        warehouse_name: r.warehouse_name,
        business_type: bizTypeMap[r.business_type] || r.business_type,
        order_no: r.order_no,
        change_qty: r.change_qty,
        change_weight: Number(r.change_weight) || 0,
        before_qty: r.before_qty,
        before_weight: Number(r.before_weight) || 0,
        after_qty: r.after_qty,
        after_weight: Number(r.after_weight) || 0,
        remark: r.remark,
        create_time: r.create_time ? r.create_time.toISOString().slice(0, 10) + ' ' + r.create_time.toISOString().slice(11, 19) : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock_journal.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存流水导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// 期初库存模板下载
exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('期初库存导入模板');
    sheet.columns = [
      { header: '仓库编码', key: 'warehouse_code', width: 15 },
      { header: '仓库名称', key: 'warehouse_name', width: 18 },
      { header: '商品编码', key: 'product_code', width: 15 },
      { header: '商品名称', key: 'product_name', width: 20 },
      { header: '商品型号', key: 'product_model', width: 20 },
      { header: '库存件数', key: 'stock_qty', width: 12 },
      { header: '库存吨位', key: 'stock_weight', width: 12 },
      { header: '预警下限(吨)', key: 'min_alert_weight', width: 15 },
      { header: '预警上限(吨)', key: 'max_alert_weight', width: 15 }
    ];
    // 添加示例行
    sheet.addRow({ warehouse_code: 'WH001', warehouse_name: '示例仓库', product_code: 'P001', product_name: '示例商品', product_model: '型号A', stock_qty: 100, stock_weight: 50, min_alert_weight: 20, max_alert_weight: 200 });
    // 表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock_import_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('下载库存模板失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// 期初库存 Excel 导入
exports.importStock = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) throw new HttpError(400, '请上传 Excel 文件');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new HttpError(400, 'Excel 文件为空');

      const rows = [];
      sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // 跳过表头
        const vals = row.values;
        // vals[0] is undefined (ExcelJS 1-based), actual data starts at 1
        if (!vals[1] && !vals[3]) return; // skip empty rows
        rows.push({
          warehouse_code: String(vals[1] || '').trim(),
          warehouse_name: String(vals[2] || '').trim(),
          product_code: String(vals[3] || '').trim(),
          product_name: String(vals[4] || '').trim(),
          product_model: String(vals[5] || '').trim(),
          stock_qty: parseInt(vals[6]) || 0,
          stock_weight: parseFloat(vals[7]) || 0,
          min_alert_weight: vals[8] ? parseFloat(vals[8]) : null,
          max_alert_weight: vals[9] ? parseFloat(vals[9]) : null
        });
      });

      if (rows.length === 0) throw new HttpError(400, '没有有效数据行');

      const errors = [];
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const lineNo = i + 2; // Excel 行号
        if (!r.warehouse_code) { errors.push(`第${lineNo}行: 仓库编码不能为空`); continue; }
        if (!r.product_code) { errors.push(`第${lineNo}行: 商品编码不能为空`); continue; }
        if (r.stock_qty < 0) { errors.push(`第${lineNo}行: 库存件数不能为负数`); continue; }
        if (r.stock_weight < 0) { errors.push(`第${lineNo}行: 库存吨位不能为负数`); continue; }

        // 验证商品存在
        const product = await Product.findOne({ where: { product_code: r.product_code, del_flag: 0 }, raw: true });
        if (!product) { errors.push(`第${lineNo}行: 商品编码 ${r.product_code} 不存在`); continue; }

        // 验证仓库存在
        const wh = await Warehouse.findOne({ where: { warehouse_code: r.warehouse_code, del_flag: 0 }, raw: true });
        if (!wh) { errors.push(`第${lineNo}行: 仓库编码 ${r.warehouse_code} 不存在`); continue; }

        // 如果没有提供名称，使用查到的名称
        const whName = r.warehouse_name || wh.warehouse_name;
        const prodName = r.product_name || product.product_name;
        const prodModel = r.product_model || product.product_model || '';

        // 查找现有库存（包括软删除记录，因为重置后记录 del_flag=1）
        let exist = await Stock.findOne({ where: { warehouse_code: r.warehouse_code, product_code: r.product_code, del_flag: 0 } });
        if (!exist) {
          exist = await Stock.findOne({ where: { warehouse_code: r.warehouse_code, product_code: r.product_code, del_flag: 1 } });
        }

        if (exist && exist.del_flag === 0) {
          // 更新库存
          const beforeQty = exist.stock_qty;
          const beforeWeight = Number(exist.stock_weight);
          await exist.update({
            warehouse_name: whName,
            product_name: prodName,
            product_model: prodModel,
            stock_qty: r.stock_qty,
            stock_weight: r.stock_weight,
            min_alert_weight: r.min_alert_weight !== null ? r.min_alert_weight : exist.min_alert_weight,
            max_alert_weight: r.max_alert_weight !== null ? r.max_alert_weight : exist.max_alert_weight,
            update_by: req.user.username
          });
          // 记录流水
          await StockJournal.create({
            warehouse_code: r.warehouse_code,
            warehouse_name: whName,
            product_code: r.product_code,
            product_name: prodName,
            product_model: prodModel,
            business_type: 'import',
            order_no: 'IMPORT',
            change_qty: r.stock_qty - beforeQty,
            change_weight: r.stock_weight - beforeWeight,
            before_qty: beforeQty,
            before_weight: beforeWeight,
            after_qty: r.stock_qty,
            after_weight: r.stock_weight,
            remark: '期初库存导入(更新)',
            create_by: req.user.username
          });
        } else if (exist && exist.del_flag === 1) {
          // 恢复软删除记录
          await exist.update({
            warehouse_name: whName,
            product_name: prodName,
            product_model: prodModel,
            stock_qty: r.stock_qty,
            stock_weight: r.stock_weight,
            min_alert_weight: r.min_alert_weight,
            max_alert_weight: r.max_alert_weight,
            del_flag: 0,
            update_by: req.user.username
          });
          await StockJournal.create({
            warehouse_code: r.warehouse_code,
            warehouse_name: whName,
            product_code: r.product_code,
            product_name: prodName,
            product_model: prodModel,
            business_type: 'import',
            order_no: 'IMPORT',
            change_qty: r.stock_qty,
            change_weight: r.stock_weight,
            before_qty: 0,
            before_weight: 0,
            after_qty: r.stock_qty,
            after_weight: r.stock_weight,
            remark: '期初库存导入(新增)',
            create_by: req.user.username
          });
        } else {
          // 新建库存
          await Stock.create({
            warehouse_code: r.warehouse_code,
            warehouse_name: whName,
            product_code: r.product_code,
            product_name: prodName,
            product_model: prodModel,
            stock_qty: r.stock_qty,
            stock_weight: r.stock_weight,
            min_alert_weight: r.min_alert_weight,
            max_alert_weight: r.max_alert_weight,
            create_by: req.user.username
          });
          await StockJournal.create({
            warehouse_code: r.warehouse_code,
            warehouse_name: whName,
            product_code: r.product_code,
            product_name: prodName,
            product_model: prodModel,
            business_type: 'import',
            order_no: 'IMPORT',
            change_qty: r.stock_qty,
            change_weight: r.stock_weight,
            before_qty: 0,
            before_weight: 0,
            after_qty: r.stock_qty,
            after_weight: r.stock_weight,
            remark: '期初库存导入(新增)',
            create_by: req.user.username
          });
        }
        successCount++;
      }

      return sendSuccess(
        res,
        { successCount, failCount: errors.length, errors },
        `成功导入 ${successCount} 条，失败 ${errors.length} 条`
      );
    } catch (err) {
      rethrowIfHttpErrorOrSequelize(err);
      console.error('库存导入失败:', err);
      if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
    }
  }
];
