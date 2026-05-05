const StockCheckOrder = require('../models/stock_check_order');
const StockCheckDetail = require('../models/stock_check_detail');
const Stock = require('../models/stock');
const StockJournal = require('../models/stock_journal');
const Warehouse = require('../models/warehouse');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const sequelize = require('../config/database');
const logService = require("../services/logService");
const { generateBillNo } = require('../utils/bill_no');

function cleanDetail(d) {
  const { id, create_time, update_time, del_flag, update_by, ...clean } = d;
  return clean;
}

// 列表
exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, warehouse_code, status, create_date_start, create_date_end, create_by } = req.query;
    const where = { del_flag: 0 };
    if (keyword) where.check_no = { [Op.like]: `%${keyword}%` };
    if (warehouse_code) where.warehouse_code = warehouse_code;
    if (status) where.status = status;
    if (create_date_start && create_date_end) {
      where.create_time = { [Op.between]: [create_date_start + ' 00:00:00', create_date_end + ' 23:59:59'] };
    } else if (create_date_start) {
      where.create_time = { [Op.gte]: create_date_start + ' 00:00:00' };
    } else if (create_date_end) {
      where.create_time = { [Op.lte]: create_date_end + ' 23:59:59' };
    }
    if (create_by) where.create_by = { [Op.like]: `%${create_by}%` };

    const { count, rows } = await StockCheckOrder.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    res.json({ code: 200, message: 'success', data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('盘点单列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 详情
exports.detail = async (req, res) => {
  try {
    const order = await StockCheckOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '盘点单不存在' });
    const details = await StockCheckDetail.findAll({ where: { check_no: order.check_no, del_flag: 0 }, order: [['id', 'ASC']] });
    res.json({ code: 200, message: 'success', data: { order, details } });
  } catch (err) {
    console.error('盘点单详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 创建
exports.create = async (req, res) => {
  try {
    const { details, ...mainData } = req.body;

    const warehouse = await Warehouse.findOne({ where: { warehouse_code: mainData.warehouse_code, del_flag: 0 }, raw: true });
    const checkNo = await generateBillNo('check');

    const order = await StockCheckOrder.create({
      ...mainData,
      check_no: checkNo,
      warehouse_name: warehouse ? warehouse.warehouse_name : '',
      status: 'draft',
      create_by: req.user.username
    });

    if (details && details.length > 0) {
      await StockCheckDetail.bulkCreate(details.map(d => ({
        ...cleanDetail(d),
        check_no: checkNo,
        create_by: req.user.username
      })));
    }

    res.json({ code: 200, message: '创建成功', data: order });
logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '创建盘点单', operationDesc: `创建盘点单，单号 ${checkNo}`, businessType: 'stock_check', businessId: String(order.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    console.error('创建盘点单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 更新（仅 draft）
exports.update = async (req, res) => {
  try {
    const order = await StockCheckOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '盘点单不存在' });
    if (order.status !== 'draft') return res.status(400).json({ code: 400, message: '仅草稿状态可编辑' });

    const { details, ...mainData } = req.body;

    await sequelize.transaction(async (t) => {
      await order.update({ ...mainData, update_by: req.user.username }, { transaction: t });

      if (details) {
        await StockCheckDetail.update({ del_flag: 1, update_by: req.user.username }, { where: { check_no: order.check_no, del_flag: 0 }, transaction: t });
        if (details.length > 0) {
          await StockCheckDetail.bulkCreate(details.map(d => ({
            ...cleanDetail(d),
            check_no: order.check_no,
            create_by: req.user.username
          })), { transaction: t });
        }
      }
    });

    res.json({ code: 200, message: '更新成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '编辑盘点单', operationDesc: `编辑盘点单，单号 ${order.check_no}`, businessType: 'stock_check', businessId: String(order.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
  } catch (err) {
    console.error('更新盘点单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 删除（仅 draft）
exports.remove = async (req, res) => {
  try {
    const order = await StockCheckOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '盘点单不存在' });
    if (order.status !== 'draft') return res.status(400).json({ code: 400, message: '仅草稿状态可删除' });

    await sequelize.transaction(async (t) => {
      await StockCheckDetail.update({ del_flag: 1, update_by: req.user.username }, { where: { check_no: order.check_no, del_flag: 0 }, transaction: t });
      await order.update({ del_flag: 1, update_by: req.user.username }, { transaction: t });
    });

    res.json({ code: 200, message: '删除成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '删除盘点单', operationDesc: `删除盘点单，单号 ${order.check_no}`, businessType: 'stock_check', businessId: String(order.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('删除盘点单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 确认盘点（draft → confirmed）
exports.confirm = async (req, res) => {
  try {
    const order = await StockCheckOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '盘点单不存在' });
    if (order.status !== 'draft') return res.status(400).json({ code: 400, message: '仅草稿状态可确认' });

    await order.update({ status: 'confirmed', update_by: req.user.username });
    res.json({ code: 200, message: '确认成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '确认盘点', operationDesc: `确认盘点单，单号 ${order.check_no}`, businessType: 'stock_check', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('确认盘点失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 调整库存（confirmed → adjusted）
exports.adjust = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN' && req.user.roleCode !== 'AUDITOR') {
      return res.status(403).json({ code: 403, message: '无权限，需要管理员或审核员角色' });
    }

    const order = await StockCheckOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '盘点单不存在' });
    if (order.status !== 'confirmed') return res.status(400).json({ code: 400, message: '仅已确认状态可调整' });

    const details = await StockCheckDetail.findAll({ where: { check_no: order.check_no, del_flag: 0 } });

    await sequelize.transaction(async (t) => {
      for (const d of details) {
        const [stock] = await Stock.findOrCreate({
          where: { warehouse_code: order.warehouse_code, product_code: d.product_code, del_flag: 0 },
          defaults: {
            warehouse_code: order.warehouse_code,
            warehouse_name: order.warehouse_name,
            product_code: d.product_code,
            product_name: d.product_name,
            product_model: d.product_model,
            stock_qty: 0,
            stock_weight: 0,
            create_by: req.user.username
          },
          transaction: t
        });

        const beforeQty = Number(stock.stock_qty);
        const beforeWeight = Number(stock.stock_weight);
        const actualQty = Number(d.actual_qty) || 0;
        const actualWeight = Number(d.actual_weight) || 0;
        const changeQty = actualQty - beforeQty;
        const changeWeight = actualWeight - beforeWeight;

        await stock.update({
          stock_qty: actualQty,
          stock_weight: actualWeight,
          update_by: req.user.username
        }, { transaction: t });

        await StockJournal.create({
          product_code: d.product_code,
          product_name: d.product_name,
          product_model: d.product_model,
          warehouse_code: order.warehouse_code,
          warehouse_name: order.warehouse_name,
          business_type: 'check',
          order_no: order.check_no,
          change_qty: changeQty,
          change_weight: changeWeight,
          before_qty: beforeQty,
          before_weight: beforeWeight,
          after_qty: actualQty,
          after_weight: actualWeight,
          remark: `盘点调整：${order.check_no}`,
          create_by: req.user.username
        }, { transaction: t });
      }

      await order.update({
        status: 'adjusted',
        audit_by: req.user.username,
        audit_time: new Date(),
        update_by: req.user.username
      }, { transaction: t });
    });

    res.json({ code: 200, message: '库存调整成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '库存管理', operation: '盘点调整库存', operationDesc: `盘点调整库存，单号 ${order.check_no}`, businessType: 'stock_check', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('调整库存失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.exportCheckOrders = async (req, res) => {
  try {
    const { keyword, warehouse_code, status, ids } = req.query;
    const where = { del_flag: 0 };
    if (ids) {
      const idList = ids.split(',').map(Number).filter(id => !isNaN(id));
      if (idList.length > 0) where.id = { [Op.in]: idList };
    }
    if (keyword) where.check_no = { [Op.like]: `%${keyword}%` };
    if (warehouse_code) where.warehouse_code = warehouse_code;
    if (status) where.status = status;

    const rows = await StockCheckOrder.findAll({ where, order: [['id', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('盘点单数据');
    sheet.columns = [
      { header: '盘点单号', key: 'check_no', width: 22 },
      { header: '仓库', key: 'warehouse_name', width: 15 },
      { header: '状态', key: 'status', width: 10 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '创建人', key: 'create_by', width: 12 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '审核人', key: 'audit_by', width: 12 },
      { header: '审核时间', key: 'audit_time', width: 20 }
    ];

    const statusMap = { draft: '草稿', confirmed: '已确认', adjusted: '已调整' };
    rows.forEach(r => {
      sheet.addRow({
        check_no: r.check_no,
        warehouse_name: r.warehouse_name,
        status: statusMap[r.status] || r.status,
        remark: r.remark,
        create_by: r.create_by,
        create_time: r.create_time ? r.create_time.toISOString().slice(0, 10) : '',
        audit_by: r.audit_by || '',
        audit_time: r.audit_time ? r.audit_time.toISOString().slice(0, 10) : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=check_orders.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('盘点单导出失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
