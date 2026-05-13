'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { STATUS_LABEL } = require('../config/constants');
const { clampPage, clampPageSize } = require('../utils/pagination');

/**
 * @param {Record<string, unknown>} q
 * @returns {{ where: string, replacements: unknown[] }}
 */
function buildOutboundDetailWhere(q) {
  const {
    startDate,
    endDate,
    warehouse_code,
    customer_code,
    product_code,
    product_name,
    product_model,
    order_status,
    keyword
  } = q;

  let where = `WHERE o.del_flag = 0 AND d.del_flag = 0`;
  const replacements = [];

  if (startDate) {
    where += ` AND o.outbound_date >= ?`;
    replacements.push(startDate);
  }
  if (endDate) {
    where += ` AND o.outbound_date <= ?`;
    replacements.push(endDate);
  }
  if (warehouse_code) {
    where += ` AND o.warehouse_code = ?`;
    replacements.push(warehouse_code);
  }
  if (customer_code) {
    where += ` AND o.customer_code = ?`;
    replacements.push(customer_code);
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

async function loadWarehouseMap(rows) {
  const whCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
  const whMap = {};
  if (whCodes.length) {
    const [whs] = await sequelize.query(
      `SELECT warehouse_code, warehouse_name FROM warehouse WHERE warehouse_code IN (?)`,
      { replacements: [whCodes] }
    );
    whs.forEach(w => {
      whMap[w.warehouse_code] = w.warehouse_name;
    });
  }
  return whMap;
}

async function loadCustomerMap(rows) {
  const cuCodes = [...new Set(rows.map(r => r.customer_code).filter(Boolean))];
  const cuMap = {};
  if (cuCodes.length) {
    const [cus] = await sequelize.query(
      `SELECT customer_code, customer_name FROM customer WHERE customer_code IN (?)`,
      { replacements: [cuCodes] }
    );
    cus.forEach(c => {
      cuMap[c.customer_code] = c.customer_name;
    });
  }
  return cuMap;
}

/**
 * @param {Record<string, unknown>} query
 */
async function outboundDetailList(query) {
  const p = clampPage(query.page);
  const ps = clampPageSize(query.pageSize, 20, 200);
  const { where, replacements } = buildOutboundDetailWhere(query);

  const countSQL = `SELECT COUNT(*) AS total FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no ${where}`;
  const dataSQL = `SELECT d.id, o.order_no, o.outbound_date, o.warehouse_code, o.customer_code, o.customer_name, d.contract_no,
      o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.contact_person, o.contact_phone,
      o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.outbound_qty, d.outbound_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.outbound_date DESC, o.order_no DESC LIMIT ? OFFSET ?`;

  const [[{ total }]] = await sequelize.query(countSQL, { replacements });
  const [rows] = await sequelize.query(dataSQL, {
    replacements: [...replacements, ps, (p - 1) * ps]
  });

  const whMap = await loadWarehouseMap(rows);

  const list = rows.map(r => ({
    id: r.id,
    order_no: r.order_no,
    outbound_date: r.outbound_date,
    warehouse_code: r.warehouse_code,
    warehouse_name: whMap[r.warehouse_code] || r.warehouse_code,
    customer_code: r.customer_code,
    customer_name: r.customer_name || r.customer_code,
    product_code: r.product_code,
    product_name: r.product_name,
    product_model: r.product_model,
    outbound_qty: r.outbound_qty,
    outbound_weight: r.outbound_weight,
    contract_no: r.contract_no,
    bill_type_code: r.bill_type_code,
    vehicle_no: r.vehicle_no,
    container_no: r.container_no,
    contact_person: r.contact_person,
    contact_phone: r.contact_phone,
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
async function writeOutboundDetailWorkbookToStream(res, query) {
  const { where, replacements } = buildOutboundDetailWhere(query);

  const dataSQL = `SELECT d.id, o.order_no, o.outbound_date, o.warehouse_code, o.customer_code, o.customer_name, d.contract_no,
      o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.contact_person, o.contact_phone,
      o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.outbound_qty, d.outbound_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.outbound_date DESC, o.order_no DESC LIMIT 10000`;

  const [rows] = await sequelize.query(dataSQL, { replacements });
  const whMap = await loadWarehouseMap(rows);
  const cuMap = await loadCustomerMap(rows);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('出库明细');
  sheet.columns = [
    { header: '出库单号', key: 'order_no', width: 20 },
    { header: '出库日期', key: 'outbound_date', width: 14 },
    { header: '仓库', key: 'warehouse_name', width: 14 },
    { header: '客户', key: 'customer_name', width: 16 },
    { header: '商品编码', key: 'product_code', width: 14 },
    { header: '商品名称', key: 'product_name', width: 14 },
    { header: '型号', key: 'product_model', width: 14 },
    { header: '出库数量', key: 'outbound_qty', width: 12 },
    { header: '出库重量(吨)', key: 'outbound_weight', width: 15 },
    { header: '合同号', key: 'contract_no', width: 16 },
    { header: '单据状态', key: 'order_status', width: 12 },
    { header: '备注', key: 'remark', width: 20 }
  ];

  rows.forEach(r => {
    sheet.addRow({
      order_no: r.order_no,
      outbound_date: r.outbound_date ? r.outbound_date.slice(0, 10) : '',
      warehouse_name: whMap[r.warehouse_code] || r.warehouse_code,
      customer_name: cuMap[r.customer_code] || r.customer_code,
      product_code: r.product_code,
      product_name: r.product_name,
      product_model: r.product_model,
      outbound_qty: r.outbound_qty,
      outbound_weight: r.outbound_weight,
      contract_no: r.contract_no,
      order_status: STATUS_LABEL[r.order_status] || r.order_status,
      remark: r.order_remark
    });
  });

  await workbook.xlsx.write(res);
}

module.exports = { outboundDetailList, writeOutboundDetailWorkbookToStream };
