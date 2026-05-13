'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { ORDER_STATUS } = require('../config/constants');

const ORDER_IN = `'${ORDER_STATUS.AUDITED}','${ORDER_STATUS.COMPLETED}'`;

/**
 * 收发存汇总：合并当前库存与区间内入出库（期初 = 期末 - 入库 + 出库）
 * @param {{ startDate?: string, endDate?: string, warehouse_code?: string }} q
 */
async function periodSummaryList(q) {
  const { startDate, endDate, warehouse_code } = q;

  let stockSQL = `SELECT s.warehouse_code, COALESCE(w.warehouse_name, s.warehouse_code) AS warehouse_name, s.product_code, s.product_name, s.product_model, SUM(s.stock_qty) AS end_qty, SUM(s.stock_weight) AS end_weight FROM stock s LEFT JOIN warehouse w ON w.warehouse_code = s.warehouse_code WHERE s.del_flag = 0 AND (s.stock_qty > 0 OR s.stock_weight > 0)`;
  const stockReps = [];
  if (warehouse_code) {
    stockSQL += ` AND s.warehouse_code = ?`;
    stockReps.push(warehouse_code);
  }
  stockSQL += ` GROUP BY s.warehouse_code, w.warehouse_name, s.product_code, s.product_name, s.product_model`;
  const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReps });

  let inSQL = `SELECT o.warehouse_code, d.product_code, COALESCE(SUM(d.inbound_qty),0) AS in_qty, COALESCE(SUM(d.inbound_weight),0) AS in_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN (${ORDER_IN})`;
  const inReps = [];
  if (startDate) {
    inSQL += ` AND o.inbound_date >= ?`;
    inReps.push(startDate);
  }
  if (endDate) {
    inSQL += ` AND o.inbound_date <= ?`;
    inReps.push(endDate);
  }
  if (warehouse_code) {
    inSQL += ` AND o.warehouse_code = ?`;
    inReps.push(warehouse_code);
  }
  inSQL += ` GROUP BY o.warehouse_code, d.product_code`;
  const [inRows] = await sequelize.query(inSQL, { replacements: inReps });

  let outSQL = `SELECT o.warehouse_code, d.product_code, COALESCE(SUM(d.outbound_qty),0) AS out_qty, COALESCE(SUM(d.outbound_weight),0) AS out_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN (${ORDER_IN})`;
  const outReps = [];
  if (startDate) {
    outSQL += ` AND o.outbound_date >= ?`;
    outReps.push(startDate);
  }
  if (endDate) {
    outSQL += ` AND o.outbound_date <= ?`;
    outReps.push(endDate);
  }
  if (warehouse_code) {
    outSQL += ` AND o.warehouse_code = ?`;
    outReps.push(warehouse_code);
  }
  outSQL += ` GROUP BY o.warehouse_code, d.product_code`;
  const [outRows] = await sequelize.query(outSQL, { replacements: outReps });

  const inMap = {};
  inRows.forEach(r => {
    inMap[r.warehouse_code + '|' + r.product_code] = r;
  });
  const outMap = {};
  outRows.forEach(r => {
    outMap[r.warehouse_code + '|' + r.product_code] = r;
  });

  const data = stockRows.map(s => {
    const key = s.warehouse_code + '|' + s.product_code;
    const ib = inMap[key];
    const ob = outMap[key];
    const inQty = ib ? Number(ib.in_qty) : 0;
    const inWeight = ib ? Number(ib.in_weight) : 0;
    const outQty = ob ? Number(ob.out_qty) : 0;
    const outWeight = ob ? Number(ob.out_weight) : 0;
    const endQty = Number(s.end_qty) || 0;
    const endWeight = Number(s.end_weight) || 0;
    const beginQty = endQty - inQty + outQty;
    const beginWeight = endWeight - inWeight + outWeight;
    return {
      warehouse_code: s.warehouse_code,
      warehouse_name: s.warehouse_name,
      product_code: s.product_code,
      product_name: s.product_name,
      product_model: s.product_model,
      begin_qty: beginQty,
      begin_weight: beginWeight,
      in_qty: inQty,
      in_weight: inWeight,
      out_qty: outQty,
      out_weight: outWeight,
      end_qty: endQty,
      end_weight: endWeight
    };
  });

  return { list: data, total: data.length };
}

/**
 * @param {import('express').Response} res
 * @param {{ startDate?: string, endDate?: string, warehouse_code?: string }} q
 */
async function writePeriodSummaryWorkbookToStream(res, q) {
  const { list: data } = await periodSummaryList(q);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('收发存汇总');
  sheet.columns = [
    { header: '仓库', key: 'warehouse_name', width: 14 },
    { header: '商品编码', key: 'product_code', width: 14 },
    { header: '商品名称', key: 'product_name', width: 14 },
    { header: '型号', key: 'product_model', width: 14 },
    { header: '期初数量', key: 'begin_qty', width: 12 },
    { header: '期初重量(吨)', key: 'begin_weight', width: 15 },
    { header: '入库数量', key: 'in_qty', width: 12 },
    { header: '入库重量(吨)', key: 'in_weight', width: 15 },
    { header: '出库数量', key: 'out_qty', width: 12 },
    { header: '出库重量(吨)', key: 'out_weight', width: 15 },
    { header: '期末数量', key: 'end_qty', width: 12 },
    { header: '期末重量(吨)', key: 'end_weight', width: 15 }
  ];
  data.forEach(r => {
    sheet.addRow({
      warehouse_name: r.warehouse_name,
      product_code: r.product_code,
      product_name: r.product_name,
      product_model: r.product_model,
      begin_qty: r.begin_qty,
      begin_weight: r.begin_weight,
      in_qty: r.in_qty,
      in_weight: r.in_weight,
      out_qty: r.out_qty,
      out_weight: r.out_weight,
      end_qty: r.end_qty,
      end_weight: r.end_weight
    });
  });

  await workbook.xlsx.write(res);
}

module.exports = { periodSummaryList, writePeriodSummaryWorkbookToStream };
