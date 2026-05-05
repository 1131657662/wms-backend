const OutboundOrder = require('../models/outbound_order');
const OutboundOrderDetail = require('../models/outbound_order_detail');
const Stock = require('../models/stock');
const StockJournal = require('../models/stock_journal');
const Warehouse = require('../models/warehouse');
const Customer = require('../models/customer');
const Product = require('../models/product');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const logService = require("../services/logService");
const notificationService = require("../services/notificationService");
const { generateBillNo } = require('../utils/bill_no');

function cleanDetail(d) {
  const { id, create_time, update_time, del_flag, update_by, ...clean } = d;
  return clean;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, ...filters } = req.query;
    const where = { del_flag: 0 };

    if (filters.order_no) where.order_no = { [Op.like]: `%${filters.order_no}%` };
    if (filters.outbound_date_start && filters.outbound_date_end) {
      where.outbound_date = { [Op.between]: [filters.outbound_date_start, filters.outbound_date_end] };
    } else if (filters.outbound_date_start) {
      where.outbound_date = { [Op.gte]: filters.outbound_date_start };
    } else if (filters.outbound_date_end) {
      where.outbound_date = { [Op.lte]: filters.outbound_date_end };
    }
    if (filters.vehicle_no) where.vehicle_no = { [Op.like]: `%${filters.vehicle_no}%` };
    if (filters.container_no) where.container_no = { [Op.like]: `%${filters.container_no}%` };
    if (filters.warehouse_code) where.warehouse_code = filters.warehouse_code;
    if (filters.bill_type_code) where.bill_type_code = filters.bill_type_code;
    if (filters.customer_code) where.customer_code = { [Op.like]: `%${filters.customer_code}%` };
    if (filters.order_status) where.order_status = filters.order_status;
    if (filters.audit_by) where.audit_by = { [Op.like]: `%${filters.audit_by}%` };
    if (filters.create_by) where.create_by = { [Op.like]: `%${filters.create_by}%` };

    const { count, rows } = await OutboundOrder.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    const orderNos = rows.map(r => r.order_no).filter(Boolean);
    let detailAggMap = {};
    if (orderNos.length > 0) {
      const details = await OutboundOrderDetail.findAll({
        attributes: [
          'order_no',
          [fn('COALESCE', fn('SUM', col('outbound_qty')), 0), 'totalQty'],
          [fn('COALESCE', fn('SUM', col('outbound_weight')), 0), 'totalWeight']
        ],
        where: { order_no: { [Op.in]: orderNos }, del_flag: 0 },
        group: ['order_no'],
        raw: true
      });
      details.forEach(d => { detailAggMap[d.order_no] = { totalQty: Number(d.totalQty), totalWeight: Number(d.totalWeight) }; });
    }

    // 批量查询仓库名称
    const warehouseCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
    const warehouseNameMap = {};
    if (warehouseCodes.length > 0) {
      const warehouses = await Warehouse.findAll({
        attributes: ['warehouse_code', 'warehouse_name'],
        where: { warehouse_code: { [Op.in]: warehouseCodes }, del_flag: 0 },
        raw: true
      });
      warehouses.forEach(w => { warehouseNameMap[w.warehouse_code] = w.warehouse_name; });
    }

    const list = rows.map(r => {
      const agg = detailAggMap[r.order_no] || { totalQty: 0, totalWeight: 0 };
      return { ...r.toJSON(), totalQty: agg.totalQty, totalWeight: agg.totalWeight, warehouse_name: warehouseNameMap[r.warehouse_code] || '' };
    });

    res.json({ code: 200, message: 'success', data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('出库单列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.detail = async (req, res) => {
  try {
    const order = await OutboundOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    const details = await OutboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 }, order: [['id', 'ASC']] });

    const orderData = order.toJSON();
    if (order.warehouse_code) {
      const warehouse = await Warehouse.findOne({ attributes: ['warehouse_name'], where: { warehouse_code: order.warehouse_code, del_flag: 0 }, raw: true });
      orderData.warehouse_name = warehouse ? warehouse.warehouse_name : '';
    }

    res.json({ code: 200, message: 'success', data: { order: orderData, details } });
  } catch (err) {
    console.error('出库单详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const { details, order_status, ...mainData } = req.body;
    const status = order_status || 'draft';

    let orderNo = '';
    if (status === 'submit') {
      orderNo = await generateBillNo('outbound');
    }

    const order = await OutboundOrder.create({
      ...mainData,
      order_no: orderNo,
      order_status: status,
      create_by: req.user.username
    });

    if (status === 'draft') {
      orderNo = `DRAFT_OUT_${order.id}`;
      await order.update({ order_no: orderNo });
    }

    if (details && details.length > 0) {
      await OutboundOrderDetail.bulkCreate(details.map(d => ({
        ...cleanDetail(d),
        uuid: d.uuid || crypto.randomUUID(),
        order_no: orderNo,
        create_by: req.user.username
      })));
    }

    res.json({ code: 200, message: status === 'submit' ? '提交成功' : '保存成功', data: order });
if (orderNo) { logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: status === 'submit' ? '提交出库单' : '创建出库单草稿', operationDesc: status === 'submit' ? `提交出库单，单号 ${orderNo}` : '创建出库单草稿', businessType: 'outbound', businessId: String(order.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
  if (status === 'submit') notificationService.createSubmitNotification(order, 'outbound').catch(e => console.error('创建提交通知失败:', e)); }
  } catch (err) {
    console.error('创建出库单失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    if (order.order_status !== 'draft' && order.order_status !== 'submit') {
      return res.status(400).json({ code: 400, message: '仅草稿或已提交状态可编辑' });
    }
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      return res.status(409).json({ code: 409, message: '数据已被他人修改，请刷新后重试' });
    }

    const { details, order_status, lock_version, ...mainData } = req.body;
    const status = order_status || order.order_status;
    const oldOrderNo = order.order_no;

    let orderNo = oldOrderNo;
    if (status === 'submit' && oldOrderNo.startsWith('DRAFT_OUT_')) {
      orderNo = await generateBillNo('outbound');
    }

    await sequelize.transaction(async (t) => {
      await order.update({
        ...mainData,
        order_no: orderNo,
        order_status: status,
        lock_version: order.lock_version + 1,
        update_by: req.user.username
      }, { transaction: t });

      if (details) {
        await OutboundOrderDetail.update({ del_flag: 1, update_by: req.user.username }, { where: { order_no: oldOrderNo, del_flag: 0 }, transaction: t });
        if (details.length > 0) {
          await OutboundOrderDetail.bulkCreate(details.map(d => ({
            ...cleanDetail(d),
            uuid: d.uuid || crypto.randomUUID(),
            order_no: orderNo,
            create_by: req.user.username
          })), { transaction: t });
        }
      }
    });

    res.json({ code: 200, message: '更新成功', data: order });
logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: '编辑出库单', operationDesc: `编辑出库单，单号 ${order.order_no}`, businessType: 'outbound', businessId: String(order.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
if (status === 'submit') notificationService.createSubmitNotification(order, 'outbound').catch(e => console.error('创建提交通知失败:', e));
  } catch (err) {
    console.error('更新出库单失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    if (order.order_status !== 'draft' && order.order_status !== 'submit') {
      return res.status(400).json({ code: 400, message: '仅草稿或已提交状态可删除' });
    }

    await sequelize.transaction(async (t) => {
      await OutboundOrderDetail.update({ del_flag: 1, update_by: req.user.username }, { where: { order_no: order.order_no }, transaction: t });
      await order.update({ del_flag: 1, update_by: req.user.username }, { transaction: t });
    });

    res.json({ code: 200, message: '删除成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: '删除出库单', operationDesc: `删除出库单，单号 ${order.order_no}`, businessType: 'outbound', businessId: String(order.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('删除出库单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.submit = async (req, res) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    if (order.order_status !== 'draft') return res.status(400).json({ code: 400, message: '仅草稿状态可提交' });
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      return res.status(409).json({ code: 409, message: '数据已被他人修改，请刷新后重试' });
    }

    const oldOrderNo = order.order_no;
    const orderNo = await generateBillNo('outbound');
    await order.update({ order_no: orderNo, order_status: 'submit', lock_version: order.lock_version + 1, update_by: req.user.username });
    await OutboundOrderDetail.update({ order_no: orderNo }, { where: { order_no: oldOrderNo, del_flag: 0 } });

    res.json({ code: 200, message: '提交成功', data: order });
logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: '提交出库单', operationDesc: `提交出库单，单号 ${order.order_no}`, businessType: 'outbound', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
notificationService.createSubmitNotification(order, 'outbound').catch(e => console.error('创建提交通知失败:', e));
  } catch (err) {
    console.error('提交出库单失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.audit = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN' && req.user.roleCode !== 'AUDITOR') {
      return res.status(403).json({ code: 403, message: '无审核权限' });
    }

    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    if (order.order_status !== 'submit') return res.status(400).json({ code: 400, message: '仅已提交状态可审核' });
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      return res.status(409).json({ code: 409, message: '数据已被他人修改，请刷新后重试' });
    }

    const details = await OutboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 } });
    if (details.length === 0) return res.status(400).json({ code: 400, message: '出库单无明细' });

    const warehouse = await Warehouse.findOne({ where: { warehouse_code: order.warehouse_code, del_flag: 0 } });

    // 批量查询商品默认预警值
    const productCodes = [...new Set(details.map(d => d.product_code))];
    const productMap = {};
    if (productCodes.length > 0) {
      const products = await Product.findAll({ attributes: ['product_code', 'default_min_alert_weight', 'default_max_alert_weight'], where: { product_code: { [Op.in]: productCodes }, del_flag: 0 }, raw: true });
      products.forEach(p => { productMap[p.product_code] = p; });
    }

    await sequelize.transaction(async (t) => {
      for (const detail of details) {
        const product = productMap[detail.product_code] || {};
        const [stock, created] = await Stock.findOrCreate({
          where: { warehouse_code: order.warehouse_code, product_code: detail.product_code, del_flag: 0 },
          defaults: {
            warehouse_code: order.warehouse_code,
            warehouse_name: warehouse ? warehouse.warehouse_name : '',
            product_code: detail.product_code,
            product_name: detail.product_name,
            product_model: detail.product_model,
            stock_qty: 0,
            stock_weight: 0,
            min_alert_weight: product.default_min_alert_weight || null,
            max_alert_weight: product.default_max_alert_weight || null,
            create_by: req.user.username
          },
          transaction: t
        });

        const stockQty = Number(stock.stock_qty) || 0;
        const stockWeight = Number(stock.stock_weight) || 0;
        const outQty = Number(detail.outbound_qty) || 0;
        const outWeight = Number(detail.outbound_weight) || 0;

        if (stockQty < outQty || stockWeight < outWeight) {
          throw new Error(`库存不足：${detail.product_code} 当前库存 ${stockQty} 件 / ${stockWeight.toFixed(4)} 吨，出库需要 ${outQty} 件 / ${outWeight.toFixed(4)} 吨`);
        }

        const newQty = stockQty - outQty;
        const newWeight = stockWeight - outWeight;

        await stock.update({
          stock_qty: newQty,
          stock_weight: newWeight,
          update_by: req.user.username
        }, { transaction: t });

        await StockJournal.create({
          product_code: detail.product_code,
          product_name: detail.product_name,
          product_model: detail.product_model,
          warehouse_code: order.warehouse_code,
          warehouse_name: warehouse ? warehouse.warehouse_name : '',
          business_type: 'outbound',
          order_no: order.order_no,
          change_qty: -outQty,
          change_weight: -outWeight,
          before_qty: stockQty,
          before_weight: stockWeight,
          after_qty: newQty,
          after_weight: newWeight,
          create_by: req.user.username
        }, { transaction: t });
      }

      await order.update({
        order_status: 'audited',
        audit_by: req.user.username,
        audit_time: new Date(),
        lock_version: order.lock_version + 1,
        update_by: req.user.username
      }, { transaction: t });
    });

    res.json({ code: 200, message: '审核成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: '审核出库单', operationDesc: `审核出库单，单号 ${order.order_no}`, businessType: 'outbound', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
notificationService.createAuditNotification(order, 'outbound').catch(e => console.error('创建审核通知失败:', e));
// 检查相关库存预警
Stock.findAll({ where: { warehouse_code: order.warehouse_code, product_code: { [Op.in]: productCodes }, del_flag: 0 }, raw: true })
  .then(stocks => {
    stocks.forEach(async (s) => {
      const w = Number(s.stock_weight) || 0;
      const min = Number(s.min_alert_weight);
      const max = Number(s.max_alert_weight);
      if (min && w < min) await notificationService.createStockAlert(s, 'low');
      else if (min && w >= min) await notificationService.resolveStockAlert(s);
      if (max && w > max) await notificationService.createStockAlert(s, 'high');
      else if (max && w <= max) await notificationService.resolveStockAlert(s);
    });
  }).catch(e => console.error('库存预警检查失败:', e));
  } catch (err) {
    console.error('审核出库单失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.batchAudit = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN' && req.user.roleCode !== 'AUDITOR') {
      return res.status(403).json({ code: 403, message: '无审核权限' });
    }
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择待审核单据' });
    }
    const results = { success: [], failed: [] };

    for (const item of items) {
      try {
        const order = await OutboundOrder.findByPk(item.id);
        if (!order) {
          results.failed.push({ id: item.id, reason: '单据不存在' });
          continue;
        }
        if (order.order_status !== 'submit') {
          results.failed.push({ id: item.id, order_no: order.order_no, reason: '状态非已提交' });
          continue;
        }
        if (item.lock_version !== undefined && item.lock_version !== order.lock_version) {
          results.failed.push({ id: item.id, order_no: order.order_no, reason: '数据已被他人修改，请刷新后重试' });
          continue;
        }

        const details = await OutboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 } });
        if (details.length === 0) {
          results.failed.push({ id: item.id, order_no: order.order_no, reason: '无明细' });
          continue;
        }

        const warehouse = await Warehouse.findOne({ where: { warehouse_code: order.warehouse_code, del_flag: 0 } });
        const productCodes = [...new Set(details.map(d => d.product_code))];
        const productMap = {};
        if (productCodes.length > 0) {
          const products = await Product.findAll({ attributes: ['product_code', 'default_min_alert_weight', 'default_max_alert_weight'], where: { product_code: { [Op.in]: productCodes }, del_flag: 0 }, raw: true });
          products.forEach(p => { productMap[p.product_code] = p; });
        }

        await sequelize.transaction(async (t) => {
          for (const detail of details) {
            const product = productMap[detail.product_code] || {};
            const [stock, created] = await Stock.findOrCreate({
              where: { warehouse_code: order.warehouse_code, product_code: detail.product_code, del_flag: 0 },
              defaults: {
                warehouse_code: order.warehouse_code,
                warehouse_name: warehouse ? warehouse.warehouse_name : '',
                product_code: detail.product_code,
                product_name: detail.product_name,
                product_model: detail.product_model,
                stock_qty: 0,
                stock_weight: 0,
                min_alert_weight: product.default_min_alert_weight || null,
                max_alert_weight: product.default_max_alert_weight || null,
                create_by: req.user.username
              },
              transaction: t
            });

            const stockQty = Number(stock.stock_qty) || 0;
            const stockWeight = Number(stock.stock_weight) || 0;
            const outQty = Number(detail.outbound_qty) || 0;
            const outWeight = Number(detail.outbound_weight) || 0;

            if (stockQty < outQty || stockWeight < outWeight) {
              throw new Error(`库存不足：${detail.product_code} 当前库存 ${stockQty} 件 / ${stockWeight.toFixed(4)} 吨，出库需要 ${outQty} 件 / ${outWeight.toFixed(4)} 吨`);
            }

            const newQty = stockQty - outQty;
            const newWeight = stockWeight - outWeight;

            await stock.update({
              stock_qty: newQty,
              stock_weight: newWeight,
              update_by: req.user.username
            }, { transaction: t });

            await StockJournal.create({
              product_code: detail.product_code,
              product_name: detail.product_name,
              product_model: detail.product_model,
              warehouse_code: order.warehouse_code,
              warehouse_name: warehouse ? warehouse.warehouse_name : '',
              business_type: 'outbound',
              order_no: order.order_no,
              change_qty: -outQty,
              change_weight: -outWeight,
              before_qty: stockQty,
              before_weight: stockWeight,
              after_qty: newQty,
              after_weight: newWeight,
              create_by: req.user.username
            }, { transaction: t });
          }

          await order.update({
            order_status: 'audited',
            audit_by: req.user.username,
            audit_time: new Date(),
            lock_version: order.lock_version + 1,
            update_by: req.user.username
          }, { transaction: t });
        });

        results.success.push({ id: item.id, order_no: order.order_no });
      } catch (e) {
        results.failed.push({ id: item.id, reason: e.message });
      }
    }

    res.json({ code: 200, data: results, message: `成功 ${results.success.length} 条，失败 ${results.failed.length} 条` });
logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: '批量审核出库单', operationDesc: `批量审核出库单，成功 ${results.success.length} 条，失败 ${results.failed.length} 条`, businessType: 'outbound', method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('批量审核出库单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.revert = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') {
      return res.status(403).json({ code: 403, message: '仅管理员可撤销审核' });
    }

    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    if (order.order_status !== 'audited') return res.status(400).json({ code: 400, message: '仅已审核状态可撤销' });
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      return res.status(409).json({ code: 409, message: '数据已被他人修改，请刷新后重试' });
    }

    const details = await OutboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 } });
    if (details.length === 0) return res.status(400).json({ code: 400, message: '出库单无明细' });

    await sequelize.transaction(async (t) => {
      for (const detail of details) {
        const stock = await Stock.findOne({
          where: { warehouse_code: order.warehouse_code, product_code: detail.product_code, del_flag: 0 },
          transaction: t
        });

        if (stock) {
          const newQty = (Number(stock.stock_qty) || 0) + (Number(detail.outbound_qty) || 0);
          const newWeight = (Number(stock.stock_weight) || 0) + (Number(detail.outbound_weight) || 0);
          await stock.update({
            stock_qty: newQty,
            stock_weight: newWeight,
            update_by: req.user.username
          }, { transaction: t });
        }
      }

      await StockJournal.update(
        { del_flag: 1, update_by: req.user.username },
        { where: { order_no: order.order_no, business_type: 'outbound', del_flag: 0 }, transaction: t }
      );

      await order.update({
        order_status: 'submit',
        audit_by: null,
        audit_time: null,
        lock_version: order.lock_version + 1,
        update_by: req.user.username
      }, { transaction: t });
    });

    res.json({ code: 200, message: '撤销审核成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '出库管理', operation: '撤销审核出库单', operationDesc: `撤销审核出库单，单号 ${order.order_no}`, businessType: 'outbound', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('撤销审核失败:', err);
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.exportOutboundOrderDetail = async (req, res) => {
  try {
    const order = await OutboundOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) return res.status(404).json({ code: 404, message: '出库单不存在' });
    const details = await OutboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 }, order: [['id', 'ASC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('出库单详情');

    sheet.columns = [
      { header: '字段', key: 'field', width: 14 },
      { header: '值', key: 'value', width: 40 }
    ];

    const statusMap = { draft: '草稿', submit: '已提交', audited: '已审核', cancelled: '已取消' };
    const infoRows = [
      { field: '单据编号', value: order.order_no },
      { field: '单据类型', value: order.bill_type_code || '出库单' },
      { field: '仓库', value: order.warehouse_code },
      { field: '客户名称', value: order.customer_name || order.customer_code || '' },
      { field: '客户地址', value: order.customer_address || '' },
      { field: '联系人', value: order.contact_person || '' },
      { field: '联系电话', value: order.contact_phone || '' },
      { field: '出库日期', value: order.outbound_date },
      { field: '车号', value: order.vehicle_no },
      { field: '柜号', value: order.container_no || '' },
      { field: '状态', value: statusMap[order.order_status] || order.order_status },
      { field: '创建人', value: order.create_by },
      { field: '创建时间', value: order.create_time ? order.create_time.slice(0, 10) + ' ' + order.create_time.slice(11, 19) : '' },
      { field: '审核人', value: order.audit_by || '' },
      { field: '审核时间', value: order.audit_time ? order.audit_time.slice(0, 10) + ' ' + order.audit_time.slice(11, 19) : '' },
      { field: '备注', value: order.remark || '' }
    ];
    infoRows.forEach(r => sheet.addRow(r));

    sheet.addRow({ field: '', value: '' });

    const detailStartRow = sheet.lastRow.number + 2;
    sheet.mergeCells(`A${detailStartRow}:G${detailStartRow}`);
    const titleRow = sheet.getCell(`A${detailStartRow}`);
    titleRow.value = '明细列表';
    titleRow.font = { bold: true, size: 13 };

    const detailHeaders = ['产品编码', '产品名称', '型号', '合同号', '出库件数', '出库吨位', '备注'];
    const headerRow = sheet.addRow(detailHeaders);
    headerRow.font = { bold: true };

    details.forEach(d => {
      sheet.addRow([
        d.product_code, d.product_name, d.product_model, d.contract_no || '',
        d.outbound_qty, d.outbound_weight, d.detail_remark || ''
      ]);
    });

    const totalQty = details.reduce((s, d) => s + (Number(d.outbound_qty) || 0), 0);
    const totalWeight = details.reduce((s, d) => s + (Number(d.outbound_weight) || 0), 0);
    const sumRow = sheet.addRow(['', '', '', '', `合计: ${totalQty}`, `合计: ${totalWeight.toFixed(4)}`, '']);
    sumRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=出库单_${order.order_no}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('出库单详情导出失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.exportOutboundOrders = async (req, res) => {
  try {
    const where = { del_flag: 0 };
    const q = req.query;
    if (q.ids) {
      const idList = q.ids.split(',').map(Number).filter(id => !isNaN(id));
      if (idList.length > 0) where.id = { [Op.in]: idList };
    }
    if (q.order_no) where.order_no = { [Op.like]: `%${q.order_no}%` };
    if (q.outbound_date_start && q.outbound_date_end) {
      where.outbound_date = { [Op.between]: [q.outbound_date_start, q.outbound_date_end] };
    } else if (q.outbound_date_start) {
      where.outbound_date = { [Op.gte]: q.outbound_date_start };
    } else if (q.outbound_date_end) {
      where.outbound_date = { [Op.lte]: q.outbound_date_end };
    }
    if (q.vehicle_no) where.vehicle_no = { [Op.like]: `%${q.vehicle_no}%` };
    if (q.container_no) where.container_no = { [Op.like]: `%${q.container_no}%` };
    if (q.warehouse_code) where.warehouse_code = q.warehouse_code;
    if (q.bill_type_code) where.bill_type_code = q.bill_type_code;
    if (q.customer_code) where.customer_code = { [Op.like]: `%${q.customer_code}%` };
    if (q.order_status) where.order_status = q.order_status;

    const rows = await OutboundOrder.findAll({ where, order: [['id', 'DESC']] });

    const orderNos = rows.map(r => r.order_no).filter(Boolean);
    let detailAggMap = {};
    if (orderNos.length > 0) {
      const details = await OutboundOrderDetail.findAll({
        attributes: ['order_no', [fn('COALESCE', fn('SUM', col('outbound_qty')), 0), 'totalQty'], [fn('COALESCE', fn('SUM', col('outbound_weight')), 0), 'totalWeight']],
        where: { order_no: { [Op.in]: orderNos }, del_flag: 0 },
        group: ['order_no'], raw: true
      });
      details.forEach(d => { detailAggMap[d.order_no] = { totalQty: Number(d.totalQty), totalWeight: Number(d.totalWeight) }; });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('出库单数据');
    sheet.columns = [
      { header: '出库单号', key: 'order_no', width: 22 },
      { header: '日期', key: 'outbound_date', width: 12 },
      { header: '仓库', key: 'warehouse_code', width: 12 },
      { header: '单据类型', key: 'bill_type_code', width: 12 },
      { header: '客户名称', key: 'customer_name', width: 20 },
      { header: '客户地址', key: 'customer_address', width: 25 },
      { header: '联系人', key: 'contact_person', width: 12 },
      { header: '联系电话', key: 'contact_phone', width: 15 },
      { header: '车牌号', key: 'vehicle_no', width: 12 },
      { header: '柜号', key: 'container_no', width: 12 },
      { header: '状态', key: 'order_status', width: 10 },
      { header: '总件数', key: 'totalQty', width: 10 },
      { header: '总重量', key: 'totalWeight', width: 12 },
      { header: '备注', key: 'remark', width: 30 }
    ];

    const statusMap = { draft: '草稿', submit: '已提交', audited: '已审核' };
    rows.forEach(r => {
      const agg = detailAggMap[r.order_no] || { totalQty: 0, totalWeight: 0 };
      sheet.addRow({
        order_no: r.order_no,
        outbound_date: r.outbound_date,
        warehouse_code: r.warehouse_code,
        bill_type_code: r.bill_type_code,
        customer_name: r.customer_name,
        customer_address: r.customer_address,
        contact_person: r.contact_person,
        contact_phone: r.contact_phone,
        vehicle_no: r.vehicle_no,
        container_no: r.container_no,
        order_status: statusMap[r.order_status] || r.order_status,
        totalQty: agg.totalQty,
        totalWeight: agg.totalWeight,
        remark: r.remark
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=outbound_orders.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('出库单导出失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
