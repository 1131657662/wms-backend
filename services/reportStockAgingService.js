'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { ORDER_STATUS } = require('../config/constants');

const ORDER_IN = `'${ORDER_STATUS.AUDITED}','${ORDER_STATUS.COMPLETED}'`;

function agingRangeLabel(ageDays) {
  if (ageDays <= 30) return '0-30天';
  if (ageDays <= 60) return '31-60天';
  if (ageDays <= 90) return '61-90天';
  return '91天以上';
}

async function loadStockRowsForAging(q) {
  const { warehouse_code, product_code } = q;
  let stockSQL = `SELECT s.warehouse_code, COALESCE(w.warehouse_name, s.warehouse_code) AS warehouse_name, s.product_code, s.product_name, s.product_model, SUM(s.stock_qty) AS current_qty, SUM(s.stock_weight) AS current_weight FROM stock s LEFT JOIN warehouse w ON w.warehouse_code = s.warehouse_code WHERE s.del_flag = 0 AND (s.stock_qty > 0 OR s.stock_weight > 0)`;
  const stockReps = [];
  if (warehouse_code) {
    stockSQL += ` AND s.warehouse_code = ?`;
    stockReps.push(warehouse_code);
  }
  if (product_code) {
    stockSQL += ` AND s.product_code LIKE ?`;
    stockReps.push(`%${product_code}%`);
  }
  stockSQL += ` GROUP BY s.warehouse_code, w.warehouse_name, s.product_code, s.product_name, s.product_model`;
  const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReps });
  return stockRows;
}

async function loadLastInboundMap() {
  const lastInSQL = `SELECT o.warehouse_code, d.product_code, MAX(o.inbound_date) AS last_inbound_date
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN (${ORDER_IN})
      GROUP BY o.warehouse_code, d.product_code`;
  const [lastInRows] = await sequelize.query(lastInSQL);
  const lastInMap = {};
  lastInRows.forEach(r => {
    lastInMap[r.warehouse_code + '|' + r.product_code] = r.last_inbound_date;
  });
  return lastInMap;
}

/**
 * @param {boolean} forExport — 导出用日期字符串；列表接口用 null / ISO 友好值
 */
function buildAgingRows(stockRows, lastInMap, forExport) {
  const now = new Date();
  return stockRows.map(s => {
    const lastIn = lastInMap[s.warehouse_code + '|' + s.product_code];
    const age = lastIn ? Math.floor((now - new Date(lastIn)) / 86400000) : 999;
    const range = agingRangeLabel(age);
    let lastInboundDisplay;
    if (forExport) {
      lastInboundDisplay = lastIn
        ? new Date(lastIn).toISOString().slice(0, 10)
        : '无记录';
    } else {
      lastInboundDisplay = lastIn || null;
    }
    return {
      warehouse_name: s.warehouse_name,
      product_code: s.product_code,
      product_name: s.product_name,
      product_model: s.product_model,
      current_qty: Number(s.current_qty),
      current_weight: Number(s.current_weight),
      last_inbound_date: lastInboundDisplay,
      age_days: age,
      aging_range: range
    };
  });
}

async function stockAgingList(q) {
  const { aging_range } = q;
  const stockRows = await loadStockRowsForAging(q);
  const lastInMap = await loadLastInboundMap();
  let data = buildAgingRows(stockRows, lastInMap, false);
  data.sort((a, b) => b.age_days - a.age_days);
  const filtered = aging_range ? data.filter(d => d.aging_range === aging_range) : data;
  return { list: filtered, total: filtered.length };
}

async function writeStockAgingWorkbookToStream(res, q) {
  const { aging_range } = q;
  const stockRows = await loadStockRowsForAging(q);
  const lastInMap = await loadLastInboundMap();
  let data = buildAgingRows(stockRows, lastInMap, true);
  data.sort((a, b) => b.age_days - a.age_days);
  if (aging_range) {
    data = data.filter(d => d.aging_range === aging_range);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('库龄分析');
  sheet.columns = [
    { header: '仓库', key: 'warehouse_name', width: 14 },
    { header: '商品编码', key: 'product_code', width: 14 },
    { header: '商品名称', key: 'product_name', width: 14 },
    { header: '型号', key: 'product_model', width: 14 },
    { header: '当前库存数量', key: 'current_qty', width: 14 },
    { header: '当前库存重量(吨)', key: 'current_weight', width: 18 },
    { header: '最后入库日期', key: 'last_inbound_date', width: 16 },
    { header: '库龄(天)', key: 'age_days', width: 12 },
    { header: '库龄区间', key: 'aging_range', width: 12 }
  ];
  data.forEach(r => sheet.addRow(r));

  await workbook.xlsx.write(res);
}

module.exports = { stockAgingList, writeStockAgingWorkbookToStream };
