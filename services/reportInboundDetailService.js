'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { STATUS_LABEL } = require('../config/constants');
const { clampPage, clampPageSize } = require('../utils/pagination');

/**
 * @param {Record<string, unknown>} q
 * @returns {{ where: string, replacements: unknown[] }}
 */
function buildInboundDetailWhere(q) {
  const {
    startDate,
    endDate,
    warehouse_code,
    supplier_code,
    product_code,
    product_name,
    product_model,
    order_status,
    keyword
  } = q;

  let where = `WHERE o.del_flag = 0 AND d.del_flag = 0`;
  const replacements = [];

  if (startDate) {
    where += ` AND o.inbound_date >= ?`;
    replacements.push(startDate);
  }
  if (endDate) {
    where += ` AND o.inbound_date <= ?`;
    replacements.push(endDate);
  }
  if (warehouse_code) {
    where += ` AND o.warehouse_code = ?`;
    replacements.push(warehouse_code);
  }
  if (supplier_code) {
    where += ` AND o.supplier_code = ?`;
    replacements.push(supplier_code);
  }
  if (product_code) {
    where += ` AND d.product_code LIKE ?`;
    replacements.push(`%${product_code}%`);
  }
  if (product_name) {
    where += ` AND d.product_name LIKE ?`;
    replacements.push(`%${product_name}%`);
  }
  if (product_model) {
    where += ` AND d.product_model LIKE ?`;
    replacements.push(`%${product_model}%`);
  }
  if (order_status) {
    where += ` AND o.order_status = ?`;
    replacements.push(order_status);
  }
  if (keyword) {
    where += ` AND o.order_no LIKE ?`;
    replacements.push(`%${keyword}%`);
  }

  return { where, replacements };
}

async function loadWarehouseSupplierMaps(rows) {
  const whCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
  const spCodes = [...new Set(rows.map(r => r.supplier_code).filter(Boolean))];
  const whMap = {};
  const spMap = {};
  if (whCodes.length) {
    const [whs] = await sequelize.query(
      `SELECT warehouse_code, warehouse_name FROM warehouse WHERE warehouse_code IN (?)`,
      { replacements: [whCodes] }
    );
    whs.forEach(w => {
      whMap[w.warehouse_code] = w.warehouse_name;
    });
  }
  if (spCodes.length) {
    const [sps] = await sequelize.query(
      `SELECT supplier_code, supplier_name FROM supplier WHERE supplier_code IN (?)`,
      { replacements: [spCodes] }
    );
    sps.forEach(s => {
      spMap[s.supplier_code] = s.supplier_name;
    });
  }
  return { whMap, spMap };
}

/**
 * @param {Record<string, unknown>} query
 */
async function inboundDetailList(query) {
  const p = clampPage(query.page);
  const ps = clampPageSize(query.pageSize, 20, 200);
  const { where, replacements } = buildInboundDetailWhere(query);

  const countSQL = `SELECT COUNT(*) AS total FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no ${where}`;
  const dataSQL = `SELECT d.id, o.order_no, o.inbound_date, o.warehouse_code, o.supplier_code, o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.delivery_no, o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.inbound_qty, d.inbound_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.inbound_date DESC, o.order_no DESC LIMIT ? OFFSET ?`;

  const [[{ total }]] = await sequelize.query(countSQL, { replacements });
  const [rows] = await sequelize.query(dataSQL, {
    replacements: [...replacements, ps, (p - 1) * ps]
  });

  const { whMap, spMap } = await loadWarehouseSupplierMaps(rows);

  const list = rows.map(r => ({
    id: r.id,
    order_no: r.order_no,
    inbound_date: r.inbound_date,
    warehouse_name: whMap[r.warehouse_code] || r.warehouse_code,
    supplier_name: spMap[r.supplier_code] || r.supplier_code,
    product_code: r.product_code,
    product_name: r.product_name,
    product_model: r.product_model,
    inbound_qty: r.inbound_qty,
    inbound_weight: r.inbound_weight,
    bill_type_code: r.bill_type_code,
    vehicle_no: r.vehicle_no,
    container_no: r.container_no,
    delivery_no: r.delivery_no,
    order_status: r.order_status,
    create_by: r.create_by,
    create_time: r.create_time,
    audit_by: r.audit_by,
    audit_time: r.audit_time,
    remark: r.order_remark
  }));

  return { list, total, page: p, pageSize: ps };
}

/**
 * @param {import('express').Response} res
 * @param {Record<string, unknown>} query
 */
async function writeInboundDetailWorkbookToStream(res, query) {
  const { where, replacements } = buildInboundDetailWhere(query);

  const dataSQL = `SELECT d.id, o.order_no, o.inbound_date, o.warehouse_code, o.supplier_code, o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.delivery_no, o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.inbound_qty, d.inbound_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.inbound_date DESC, o.order_no DESC LIMIT 10000`;

  const [rows] = await sequelize.query(dataSQL, { replacements });
  const { whMap, spMap } = await loadWarehouseSupplierMaps(rows);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('入库明细');
  sheet.columns = [
    { header: '入库单号', key: 'order_no', width: 20 },
    { header: '入库日期', key: 'inbound_date', width: 14 },
    { header: '仓库', key: 'warehouse_name', width: 14 },
    { header: '供应商', key: 'supplier_name', width: 16 },
    { header: '商品编码', key: 'product_code', width: 14 },
    { header: '商品名称', key: 'product_name', width: 14 },
    { header: '型号', key: 'product_model', width: 14 },
    { header: '入库数量', key: 'inbound_qty', width: 12 },
    { header: '入库重量(吨)', key: 'inbound_weight', width: 15 },
    { header: '单据状态', key: 'order_status', width: 12 },
    { header: '备注', key: 'remark', width: 20 }
  ];
  rows.forEach(r => {
    sheet.addRow({
      order_no: r.order_no,
      inbound_date: r.inbound_date ? r.inbound_date.slice(0, 10) : '',
      warehouse_name: whMap[r.warehouse_code] || r.warehouse_code,
      supplier_name: spMap[r.supplier_code] || r.supplier_code,
      product_code: r.product_code,
      product_name: r.product_name,
      product_model: r.product_model,
      inbound_qty: r.inbound_qty,
      inbound_weight: r.inbound_weight,
      order_status: STATUS_LABEL[r.order_status] || r.order_status,
      remark: r.order_remark
    });
  });

  await workbook.xlsx.write(res);
}

module.exports = { inboundDetailList, writeInboundDetailWorkbookToStream };
