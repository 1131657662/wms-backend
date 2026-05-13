'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { STOCK_JOURNAL_BUSINESS_LABELS } = require('../config/constants');
const { clampPage, clampPageSize } = require('../utils/pagination');

function buildStockJournalWhere(q) {
  const { startDate, endDate, warehouse_name, product_code, business_type } = q;
  let where = `WHERE 1=1`;
  const replacements = [];

  if (startDate) {
    where += ` AND create_time >= ?`;
    replacements.push(startDate);
  }
  if (endDate) {
    where += ` AND create_time <= ?`;
    replacements.push(endDate + ' 23:59:59');
  }
  if (warehouse_name) {
    where += ` AND warehouse_name LIKE ?`;
    replacements.push(`%${warehouse_name}%`);
  }
  if (product_code) {
    where += ` AND product_code LIKE ?`;
    replacements.push(`%${product_code}%`);
  }
  if (business_type) {
    where += ` AND business_type = ?`;
    replacements.push(business_type);
  }

  return { where, replacements };
}

function labelBusinessType(code) {
  return STOCK_JOURNAL_BUSINESS_LABELS[code] || code;
}

async function stockJournalList(query) {
  const p = clampPage(query.page);
  const ps = clampPageSize(query.pageSize, 20, 200);
  const { where, replacements } = buildStockJournalWhere(query);

  const countSQL = `SELECT COUNT(*) AS total FROM stock_journal ${where}`;
  const dataSQL = `SELECT * FROM stock_journal ${where} ORDER BY create_time DESC, id DESC LIMIT ? OFFSET ?`;

  const [[{ total }]] = await sequelize.query(countSQL, { replacements });
  const [rows] = await sequelize.query(dataSQL, {
    replacements: [...replacements, ps, (p - 1) * ps]
  });

  const list = rows.map(r => ({
    id: r.id,
    create_time: r.create_time,
    warehouse_name: r.warehouse_name,
    product_code: r.product_code,
    product_name: r.product_name,
    product_model: r.product_model,
    business_type: labelBusinessType(r.business_type),
    order_no: r.order_no,
    change_qty: r.change_qty,
    change_weight: r.change_weight,
    before_qty: r.before_qty,
    before_weight: r.before_weight,
    after_qty: r.after_qty,
    after_weight: r.after_weight,
    remark: r.remark
  }));

  return { list, total, page: p, pageSize: ps };
}

async function writeStockJournalWorkbookToStream(res, query) {
  const { where, replacements } = buildStockJournalWhere(query);
  const dataSQL = `SELECT * FROM stock_journal ${where} ORDER BY create_time DESC, id DESC LIMIT 10000`;
  const [rows] = await sequelize.query(dataSQL, { replacements });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('进销存台账');
  sheet.columns = [
    { header: '日期时间', key: 'create_time', width: 20 },
    { header: '仓库', key: 'warehouse_name', width: 14 },
    { header: '商品编码', key: 'product_code', width: 14 },
    { header: '商品名称', key: 'product_name', width: 14 },
    { header: '型号', key: 'product_model', width: 14 },
    { header: '业务类型', key: 'business_type', width: 12 },
    { header: '关联单号', key: 'order_no', width: 20 },
    { header: '变化数量', key: 'change_qty', width: 12 },
    { header: '变化重量(吨)', key: 'change_weight', width: 15 },
    { header: '变化前数量', key: 'before_qty', width: 12 },
    { header: '变化前重量', key: 'before_weight', width: 15 },
    { header: '变化后数量', key: 'after_qty', width: 12 },
    { header: '变化后重量', key: 'after_weight', width: 15 },
    { header: '备注', key: 'remark', width: 20 }
  ];

  rows.forEach(r => {
    sheet.addRow({
      create_time: r.create_time ? new Date(r.create_time).toLocaleString('zh-CN') : '',
      warehouse_name: r.warehouse_name,
      product_code: r.product_code,
      product_name: r.product_name,
      product_model: r.product_model,
      business_type: labelBusinessType(r.business_type),
      order_no: r.order_no,
      change_qty: r.change_qty,
      change_weight: r.change_weight,
      before_qty: r.before_qty,
      before_weight: r.before_weight,
      after_qty: r.after_qty,
      after_weight: r.after_weight,
      remark: r.remark
    });
  });

  await workbook.xlsx.write(res);
}

module.exports = { stockJournalList, writeStockJournalWorkbookToStream };
