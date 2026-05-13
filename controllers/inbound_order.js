const InboundOrder = require('../models/inbound_order');
const InboundOrderDetail = require('../models/inbound_order_detail');
const Stock = require('../models/stock');
const StockJournal = require('../models/stock_journal');
const Warehouse = require('../models/warehouse');
const Supplier = require('../models/supplier');
const Product = require('../models/product');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const logService = require("../services/logService");
const notificationService = require("../services/notificationService");
const { generateBillNo } = require('../utils/bill_no');
const { ORDER_STATUS, STATUS_LABEL } = require('../config/constants');
const { listPage: inboundListPage } = require('../services/inboundOrderListService');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize, BULK_LIST_MAX } = require('../utils/pagination');

// 清理前端传来的明细数据，移除不可插入的字段
function cleanDetail(d) {
  const { id, create_time, update_time, del_flag, update_by, ...clean } = d;
  return clean;
}

// 列表（带明细合计 + 多条件筛选）
exports.list = async (req, res) => {
  try {
    const data = await inboundListPage(req.query);
    return sendSuccess(res, data);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('入库单列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 详情（含明细）
exports.detail = async (req, res) => {
  try {
    const order = await InboundOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) throw new HttpError(404, '入库单不存在');
    const details = await InboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 }, order: [['id', 'ASC']] });
    const orderData = order.toJSON();
    if (order.supplier_code) {
      const supplier = await Supplier.findOne({ attributes: ['supplier_name'], where: { supplier_code: order.supplier_code, del_flag: 0 }, raw: true });
      orderData.supplier_name = supplier ? supplier.supplier_name : '';
    } else {
      orderData.supplier_name = '';
    }
    if (order.warehouse_code) {
      const warehouse = await Warehouse.findOne({ attributes: ['warehouse_name'], where: { warehouse_code: order.warehouse_code, del_flag: 0 }, raw: true });
      orderData.warehouse_name = warehouse ? warehouse.warehouse_name : '';
    } else {
      orderData.warehouse_name = '';
    }
    return sendSuccess(res, { order: orderData, details });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('入库单详情失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 增强搜索（支持关键字 + 明细级产品搜索 + 供应商名称搜索）
exports.search = async (req, res) => {
  try {
    const {
      keyword, product_code, product_name, product_model, supplier_name,
      ...filters
    } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10, BULK_LIST_MAX);

    const where = { del_flag: 0 };

    // 如果按明细搜索产品，先查明细表获取匹配的 order_no
    if (product_code || product_name || product_model) {
      const detailWhere = { del_flag: 0 };
      if (product_code) detailWhere.product_code = { [Op.like]: `%${product_code}%` };
      if (product_name) detailWhere.product_name = { [Op.like]: `%${product_name}%` };
      if (product_model) detailWhere.product_model = { [Op.like]: `%${product_model}%` };

      const details = await InboundOrderDetail.findAll({
        where: detailWhere,
        attributes: [[fn('DISTINCT', col('order_no')), 'order_no']],
        raw: true,
      });
      const detailOrderNos = details.map(d => d.order_no);
      if (detailOrderNos.length === 0) {
        return sendSuccess(res, { list: [], total: 0, page: Number(page), pageSize: Number(pageSize) });
      }
      where.order_no = { [Op.in]: detailOrderNos };
    }

    // 关键字搜索：单号/车号/柜号/来货单号
    if (keyword) {
      where[Op.or] = [
        { order_no: { [Op.like]: `%${keyword}%` } },
        { vehicle_no: { [Op.like]: `%${keyword}%` } },
        { container_no: { [Op.like]: `%${keyword}%` } },
        { delivery_no: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // 供应商名称搜索：先查 Supplier 表获取 supplier_code
    if (supplier_name) {
      const suppliers = await Supplier.findAll({
        where: { supplier_name: { [Op.like]: `%${supplier_name}%` }, del_flag: 0 },
        attributes: ['supplier_code'],
        raw: true,
      });
      const codes = suppliers.map(s => s.supplier_code);
      if (codes.length > 0) {
        where.supplier_code = { [Op.in]: codes };
      } else {
        return sendSuccess(res, { list: [], total: 0, page: Number(page), pageSize: Number(pageSize) });
      }
    }

    // 复用 list 方法的通用筛选逻辑
    if (filters.order_no) where.order_no = { [Op.like]: `%${filters.order_no}%` };
    if (filters.inbound_date_start && filters.inbound_date_end) {
      where.inbound_date = { [Op.between]: [filters.inbound_date_start, filters.inbound_date_end] };
    } else if (filters.inbound_date_start) {
      where.inbound_date = { [Op.gte]: filters.inbound_date_start };
    } else if (filters.inbound_date_end) {
      where.inbound_date = { [Op.lte]: filters.inbound_date_end };
    }
    if (filters.vehicle_no) where.vehicle_no = { [Op.like]: `%${filters.vehicle_no}%` };
    if (filters.container_no) where.container_no = { [Op.like]: `%${filters.container_no}%` };
    if (filters.warehouse_code) where.warehouse_code = filters.warehouse_code;
    if (filters.supplier_code) where.supplier_code = { [Op.like]: `%${filters.supplier_code}%` };
    if (filters.order_status) where.order_status = filters.order_status;

    const { count, rows } = await InboundOrder.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    // 批量查询明细合计
    const orderNos = rows.map(r => r.order_no).filter(Boolean);
    let detailAggMap = {};
    if (orderNos.length > 0) {
      const details = await InboundOrderDetail.findAll({
        attributes: [
          'order_no',
          [fn('COALESCE', fn('SUM', col('inbound_qty')), 0), 'totalQty'],
          [fn('COALESCE', fn('SUM', col('inbound_weight')), 0), 'totalWeight']
        ],
        where: { order_no: { [Op.in]: orderNos }, del_flag: 0 },
        group: ['order_no'],
        raw: true
      });
      details.forEach(d => { detailAggMap[d.order_no] = { totalQty: Number(d.totalQty), totalWeight: Number(d.totalWeight) }; });
    }

    // 批量查询供应商和仓库名称
    const supplierCodes = [...new Set(rows.map(r => r.supplier_code).filter(Boolean))];
    const warehouseCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
    const [supplierMap, warehouseMap] = await Promise.all([
      (async () => {
        const map = {};
        if (supplierCodes.length > 0) {
          const suppliers = await Supplier.findAll({ attributes: ['supplier_code', 'supplier_name'], where: { supplier_code: { [Op.in]: supplierCodes }, del_flag: 0 }, raw: true });
          suppliers.forEach(s => { map[s.supplier_code] = s.supplier_name; });
        }
        return map;
      })(),
      (async () => {
        const map = {};
        if (warehouseCodes.length > 0) {
          const warehouses = await Warehouse.findAll({ attributes: ['warehouse_code', 'warehouse_name'], where: { warehouse_code: { [Op.in]: warehouseCodes }, del_flag: 0 }, raw: true });
          warehouses.forEach(w => { map[w.warehouse_code] = w.warehouse_name; });
        }
        return map;
      })()
    ]);

    const list = rows.map(r => {
      const agg = detailAggMap[r.order_no] || { totalQty: 0, totalWeight: 0 };
      return { ...r.toJSON(), totalQty: agg.totalQty, totalWeight: agg.totalWeight, supplier_name: supplierMap[r.supplier_code] || '', warehouse_name: warehouseMap[r.warehouse_code] || '' };
    });

    return sendSuccess(res, { list, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('入库单搜索失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 创建（保存草稿 or 直接提交）
exports.create = async (req, res) => {
  try {
    const { details, order_status, ...mainData } = req.body;
    const status = order_status || ORDER_STATUS.DRAFT;

    let orderNo = '';
    if (status === ORDER_STATUS.SUBMIT) {
      orderNo = await generateBillNo('inbound');
    }

    await clearSoftDeletedConflicts(InboundOrder, req.body, ['order_no']);
    const order = await InboundOrder.create({
      ...mainData,
      order_no: orderNo,
      order_status: status,
      create_by: req.user.username
    });

    // 草稿状态用 DRAFT_{id} 作为临时单号
    if (status === ORDER_STATUS.DRAFT) {
      orderNo = `DRAFT_${order.id}`;
      await order.update({ order_no: orderNo });
    }

    if (details && details.length > 0) {
      await InboundOrderDetail.bulkCreate(details.map(d => ({
        ...cleanDetail(d),
        uuid: d.uuid || crypto.randomUUID(),
        order_no: orderNo,
        create_by: req.user.username
      })));
    }

    return sendSuccess(res, order, status === ORDER_STATUS.SUBMIT ? '提交成功' : '保存成功');
if (orderNo) { logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: status === ORDER_STATUS.SUBMIT ? '提交入库单' : '创建入库单草稿', operationDesc: status === ORDER_STATUS.SUBMIT ? `提交入库单，单号 ${orderNo}` : '创建入库单草稿', businessType: 'inbound', businessId: String(order.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
  if (status === ORDER_STATUS.SUBMIT) notificationService.createSubmitNotification(order, 'inbound').catch(e => console.error('创建提交通知失败:', e)); }
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建入库单失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 更新（draft 或 submit）
exports.update = async (req, res) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) throw new HttpError(404, '入库单不存在');
    if (order.order_status !== ORDER_STATUS.DRAFT && order.order_status !== ORDER_STATUS.SUBMIT) {
      throw new HttpError(400, '仅草稿或已提交状态可编辑');
    }
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      throw new HttpError(409, '数据已被他人修改，请刷新后重试');
    }

    const { details, order_status, lock_version, ...mainData } = req.body;
    const status = order_status || order.order_status;
    const oldOrderNo = order.order_no;

    let orderNo = oldOrderNo;
    if (status === ORDER_STATUS.SUBMIT && oldOrderNo.startsWith('DRAFT_')) {
      orderNo = await generateBillNo('inbound');
    }

    await clearSoftDeletedConflicts(InboundOrder, req.body, ['order_no']);
    await sequelize.transaction(async (t) => {
      await order.update({
        ...mainData,
        order_no: orderNo,
        order_status: status,
        lock_version: order.lock_version + 1,
        update_by: req.user.username
      }, { transaction: t });

      if (details) {
        await InboundOrderDetail.update({ del_flag: 1, update_by: req.user.username }, { where: { order_no: oldOrderNo, del_flag: 0 }, transaction: t });
        if (details.length > 0) {
          await InboundOrderDetail.bulkCreate(details.map(d => ({
            ...cleanDetail(d),
            uuid: d.uuid || crypto.randomUUID(),
            order_no: orderNo,
            create_by: req.user.username
          })), { transaction: t });
        }
      }
    });

    return sendSuccess(res, order, '更新成功');
logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: '编辑入库单', operationDesc: `编辑入库单，单号 ${order.order_no}`, businessType: 'inbound', businessId: String(order.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
if (status === ORDER_STATUS.SUBMIT) notificationService.createSubmitNotification(order, 'inbound').catch(e => console.error('创建提交通知失败:', e));
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新入库单失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 删除（draft 或 submit，均未影响库存）
exports.remove = async (req, res) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) throw new HttpError(404, '入库单不存在');
    if (order.order_status !== ORDER_STATUS.DRAFT && order.order_status !== ORDER_STATUS.SUBMIT) {
      throw new HttpError(400, '仅草稿或已提交状态可删除');
    }

    await sequelize.transaction(async (t) => {
      await InboundOrderDetail.update({ del_flag: 1, update_by: req.user.username }, { where: { order_no: order.order_no }, transaction: t });
      await order.update({ del_flag: 1, update_by: req.user.username }, { transaction: t });
    });

    return sendSuccess(res, null, '删除成功');
logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: '删除入库单', operationDesc: `删除入库单，单号 ${order.order_no}`, businessType: 'inbound', businessId: String(order.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('删除入库单失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 提交（draft→submit，生成单号）
exports.submit = async (req, res) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) throw new HttpError(404, '入库单不存在');
    if (order.order_status !== ORDER_STATUS.DRAFT) throw new HttpError(400, '仅草稿状态可提交');
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      throw new HttpError(409, '数据已被他人修改，请刷新后重试');
    }

    const oldOrderNo = order.order_no;
    const orderNo = await generateBillNo('inbound');
    await order.update({ order_no: orderNo, order_status: ORDER_STATUS.SUBMIT, lock_version: order.lock_version + 1, update_by: req.user.username });
    // 更新明细的 order_no
    await InboundOrderDetail.update({ order_no: orderNo }, { where: { order_no: oldOrderNo, del_flag: 0 } });

    return sendSuccess(res, order, '提交成功');
logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: '提交入库单', operationDesc: `提交入库单，单号 ${order.order_no}`, businessType: 'inbound', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
notificationService.createSubmitNotification(order, 'inbound').catch(e => console.error('创建提交通知失败:', e));
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('提交入库单失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 审核（submit→audited，事务更新库存+流水）
exports.audit = async (req, res) => {
  try {
    // 权限检查：ADMIN 或 AUDITOR 可审核
    if (req.user.roleCode !== 'ADMIN' && req.user.roleCode !== 'AUDITOR') {
      throw new HttpError(403, '无审核权限');
    }

    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) throw new HttpError(404, '入库单不存在');
    if (order.order_status !== ORDER_STATUS.SUBMIT) throw new HttpError(400, '仅已提交状态可审核');
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      throw new HttpError(409, '数据已被他人修改，请刷新后重试');
    }

    const details = await InboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 } });
    if (details.length === 0) throw new HttpError(400, '入库单无明细');

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

        const beforeQty = Number(stock.stock_qty) || 0;
        const beforeWeight = Number(stock.stock_weight) || 0;
        const changeQty = Number(detail.inbound_qty) || 0;
        const changeWeight = Number(detail.inbound_weight) || 0;

        await stock.update({
          stock_qty: beforeQty + changeQty,
          stock_weight: beforeWeight + changeWeight,
          update_by: req.user.username
        }, { transaction: t });

        await StockJournal.create({
          product_code: detail.product_code,
          product_name: detail.product_name,
          product_model: detail.product_model,
          warehouse_code: order.warehouse_code,
          warehouse_name: warehouse ? warehouse.warehouse_name : '',
          business_type: 'inbound',
          order_no: order.order_no,
          change_qty: changeQty,
          change_weight: changeWeight,
          before_qty: beforeQty,
          before_weight: beforeWeight,
          after_qty: beforeQty + changeQty,
          after_weight: beforeWeight + changeWeight,
          create_by: req.user.username
        }, { transaction: t });
      }

      await order.update({
        order_status: ORDER_STATUS.AUDITED,
        audit_by: req.user.username,
        audit_time: new Date(),
        lock_version: order.lock_version + 1,
        update_by: req.user.username
      }, { transaction: t });
    });

    return sendSuccess(res, null, '审核成功');
logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: '审核入库单', operationDesc: `审核入库单，单号 ${order.order_no}`, businessType: 'inbound', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
notificationService.createAuditNotification(order, 'inbound').catch(e => console.error('创建审核通知失败:', e));
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
    rethrowIfHttpErrorOrSequelize(err);
    console.error('审核入库单失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 批量审核
exports.batchAudit = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN' && req.user.roleCode !== 'AUDITOR') {
      throw new HttpError(403, '无审核权限');
    }
    const { items } = req.body;
    if (!items || items.length === 0) {
      throw new HttpError(400, '请选择待审核单据');
    }
    const results = { success: [], failed: [] };

    for (const item of items) {
      try {
        const order = await InboundOrder.findByPk(item.id);
        if (!order) {
          results.failed.push({ id: item.id, reason: '单据不存在' });
          continue;
        }
        if (order.order_status !== ORDER_STATUS.SUBMIT) {
          results.failed.push({ id: item.id, order_no: order.order_no, reason: '状态非已提交' });
          continue;
        }
        if (item.lock_version !== undefined && item.lock_version !== order.lock_version) {
          results.failed.push({ id: item.id, order_no: order.order_no, reason: '数据已被他人修改，请刷新后重试' });
          continue;
        }

        const details = await InboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 } });
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

            const beforeQty = Number(stock.stock_qty) || 0;
            const beforeWeight = Number(stock.stock_weight) || 0;
            const changeQty = Number(detail.inbound_qty) || 0;
            const changeWeight = Number(detail.inbound_weight) || 0;

            await stock.update({
              stock_qty: beforeQty + changeQty,
              stock_weight: beforeWeight + changeWeight,
              update_by: req.user.username
            }, { transaction: t });

            await StockJournal.create({
              product_code: detail.product_code,
              product_name: detail.product_name,
              product_model: detail.product_model,
              warehouse_code: order.warehouse_code,
              warehouse_name: warehouse ? warehouse.warehouse_name : '',
              business_type: 'inbound',
              order_no: order.order_no,
              change_qty: changeQty,
              change_weight: changeWeight,
              before_qty: beforeQty,
              before_weight: beforeWeight,
              after_qty: beforeQty + changeQty,
              after_weight: beforeWeight + changeWeight,
              create_by: req.user.username
            }, { transaction: t });
          }

          await order.update({
            order_status: ORDER_STATUS.AUDITED,
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

    return sendSuccess(res, results, `成功 ${results.success.length} 条，失败 ${results.failed.length} 条`);
logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: '批量审核入库单', operationDesc: `批量审核入库单，成功 ${results.success.length} 条，失败 ${results.failed.length} 条`, businessType: 'inbound', method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('批量审核入库单失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

// 撤销审核（audited → submit，仅 ADMIN，事务内反向更新库存并清除流水）
exports.revert = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') {
      throw new HttpError(403, '仅管理员可撤销审核');
    }

    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) throw new HttpError(404, '入库单不存在');
    if (order.order_status !== ORDER_STATUS.AUDITED) throw new HttpError(400, '仅已审核状态可撤销');
    if (req.body.lock_version !== undefined && req.body.lock_version !== order.lock_version) {
      throw new HttpError(409, '数据已被他人修改，请刷新后重试');
    }

    const details = await InboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 } });
    if (details.length === 0) throw new HttpError(400, '入库单无明细');

    await sequelize.transaction(async (t) => {
      for (const detail of details) {
        const stock = await Stock.findOne({
          where: { warehouse_code: order.warehouse_code, product_code: detail.product_code, del_flag: 0 },
          transaction: t
        });
        if (stock) {
          const newQty = Math.max(0, (Number(stock.stock_qty) || 0) - (Number(detail.inbound_qty) || 0));
          const newWeight = Math.max(0, (Number(stock.stock_weight) || 0) - (Number(detail.inbound_weight) || 0));
          await stock.update({ stock_qty: newQty, stock_weight: newWeight, update_by: req.user.username }, { transaction: t });
        }
      }
      await StockJournal.update({ del_flag: 1, update_by: req.user.username }, { where: { order_no: order.order_no, business_type: 'inbound', del_flag: 0 }, transaction: t });
      await order.update({ order_status: ORDER_STATUS.SUBMIT, audit_by: null, audit_time: null, lock_version: order.lock_version + 1, update_by: req.user.username }, { transaction: t });
    });

    return sendSuccess(res, null, '撤销审核成功');
    logService.log({ userId: req.user.id, username: req.user.username, module: '入库管理', operation: '撤销审核入库单', operationDesc: `撤销审核入库单，单号 ${order.order_no}`, businessType: 'inbound', businessId: String(order.id), method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('撤销审核失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportInboundOrderDetail = async (req, res) => {
  try {
    const order = await InboundOrder.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!order) throw new HttpError(404, '入库单不存在');
    const details = await InboundOrderDetail.findAll({ where: { order_no: order.order_no, del_flag: 0 }, order: [['id', 'ASC']] });
    let supplierName = '';
    if (order.supplier_code) {
      const supplier = await Supplier.findOne({ attributes: ['supplier_name'], where: { supplier_code: order.supplier_code, del_flag: 0 }, raw: true });
      supplierName = supplier ? supplier.supplier_name : '';
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('入库单详情');

    // 主表信息
    const infoData = [
      ['字段', '值'],
      ['单据编号', order.order_no],
      ['单据类型', order.bill_type_code || '入库单'],
      ['仓库', order.warehouse_code],
      ['供应商', supplierName || order.supplier_code || ''],
      ['入库日期', order.inbound_date],
      ['车号', order.vehicle_no],
      ['柜号', order.container_no || ''],
      ['来货单号', order.delivery_no || ''],
      ['状态', STATUS_LABEL[order.order_status] || order.order_status],
      ['创建人', order.create_by],
      ['创建时间', order.create_time ? order.create_time.substring(0, 10) + ' ' + order.create_time.substring(11, 19) : ''],
      ['审核人', order.audit_by || ''],
      ['审核时间', order.audit_time ? order.audit_time.substring(0, 10) + ' ' + order.audit_time.substring(11, 19) : ''],
      ['备注', order.remark || '']
    ];
    infoData.forEach(r => sheet.addRow(r));

    sheet.addRow([]); // 空行

    // 明细标题
    const titleRow = sheet.addRow(['明细列表']);
    titleRow.font = { bold: true, size: 13 };

    // 明细表头
    const headerRow = sheet.addRow(['产品编码', '产品名称', '型号', '入库件数', '入库吨位', '备注']);
    headerRow.font = { bold: true };

    // 明细数据
    details.forEach(d => {
      sheet.addRow([
        d.product_code, d.product_name, d.product_model,
        d.inbound_qty, d.inbound_weight, d.detail_remark || ''
      ]);
    });

    // 合计
    const totalQty = details.reduce((s, d) => s + (Number(d.inbound_qty) || 0), 0);
    const totalWeight = details.reduce((s, d) => s + (Number(d.inbound_weight) || 0), 0);
    const sumRow = sheet.addRow(['', '', '', `合计: ${totalQty}`, `合计: ${totalWeight.toFixed(4)}`, '']);
    sumRow.font = { bold: true };

    // 列宽
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 14;
    sheet.getColumn(4).width = 14;
    sheet.getColumn(5).width = 14;
    sheet.getColumn(6).width = 40;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('入库单_' + order.order_no + '.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('入库单详情导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportInboundOrders = async (req, res) => {
  try {
    const where = { del_flag: 0 };
    const q = req.query;
    if (q.ids) {
      const idList = q.ids.split(',').map(Number).filter(id => !isNaN(id));
      if (idList.length > 0) where.id = { [Op.in]: idList };
    }
    if (q.order_no) where.order_no = { [Op.like]: `%${q.order_no}%` };
    if (q.inbound_date_start && q.inbound_date_end) {
      where.inbound_date = { [Op.between]: [q.inbound_date_start, q.inbound_date_end] };
    } else if (q.inbound_date_start) {
      where.inbound_date = { [Op.gte]: q.inbound_date_start };
    } else if (q.inbound_date_end) {
      where.inbound_date = { [Op.lte]: q.inbound_date_end };
    }
    if (q.vehicle_no) where.vehicle_no = { [Op.like]: `%${q.vehicle_no}%` };
    if (q.container_no) where.container_no = { [Op.like]: `%${q.container_no}%` };
    if (q.warehouse_code) where.warehouse_code = q.warehouse_code;
    if (q.bill_type_code) where.bill_type_code = q.bill_type_code;
    if (q.supplier_code) where.supplier_code = { [Op.like]: `%${q.supplier_code}%` };
    if (q.delivery_no) where.delivery_no = { [Op.like]: `%${q.delivery_no}%` };
    if (q.order_status) where.order_status = q.order_status;

    const rows = await InboundOrder.findAll({ where, order: [['id', 'DESC']] });

    const orderNos = rows.map(r => r.order_no).filter(Boolean);
    let detailAggMap = {};
    if (orderNos.length > 0) {
      const details = await InboundOrderDetail.findAll({
        attributes: ['order_no', [fn('COALESCE', fn('SUM', col('inbound_qty')), 0), 'totalQty'], [fn('COALESCE', fn('SUM', col('inbound_weight')), 0), 'totalWeight']],
        where: { order_no: { [Op.in]: orderNos }, del_flag: 0 },
        group: ['order_no'], raw: true
      });
      details.forEach(d => { detailAggMap[d.order_no] = { totalQty: Number(d.totalQty), totalWeight: Number(d.totalWeight) }; });
    }

    const supplierCodes = [...new Set(rows.map(r => r.supplier_code).filter(Boolean))];
    const supplierMap = {};
    if (supplierCodes.length > 0) {
      const suppliers = await Supplier.findAll({ attributes: ['supplier_code', 'supplier_name'], where: { supplier_code: { [Op.in]: supplierCodes }, del_flag: 0 }, raw: true });
      suppliers.forEach(s => { supplierMap[s.supplier_code] = s.supplier_name; });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('入库单数据');
    sheet.columns = [
      { header: '入库单号', key: 'order_no', width: 22 },
      { header: '日期', key: 'inbound_date', width: 12 },
      { header: '仓库', key: 'warehouse_code', width: 12 },
      { header: '单据类型', key: 'bill_type_code', width: 12 },
      { header: '供应商', key: 'supplier_name', width: 20 },
      { header: '车牌号', key: 'vehicle_no', width: 12 },
      { header: '柜号', key: 'container_no', width: 12 },
      { header: '送货单号', key: 'delivery_no', width: 15 },
      { header: '状态', key: 'order_status', width: 10 },
      { header: '总件数', key: 'totalQty', width: 10 },
      { header: '总重量', key: 'totalWeight', width: 12 },
      { header: '备注', key: 'remark', width: 30 }
    ];

    rows.forEach(r => {
      const agg = detailAggMap[r.order_no] || { totalQty: 0, totalWeight: 0 };
      sheet.addRow({
        order_no: r.order_no,
        inbound_date: r.inbound_date,
        warehouse_code: r.warehouse_code,
        bill_type_code: r.bill_type_code,
        supplier_name: supplierMap[r.supplier_code] || '',
        vehicle_no: r.vehicle_no,
        container_no: r.container_no,
        delivery_no: r.delivery_no,
        order_status: STATUS_LABEL[r.order_status] || r.order_status,
        totalQty: agg.totalQty,
        totalWeight: agg.totalWeight,
        remark: r.remark
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inbound_orders.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('入库单导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

