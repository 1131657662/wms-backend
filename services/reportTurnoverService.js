'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { ORDER_STATUS } = require('../config/constants');
const { HttpError } = require('../utils/httpError');

const ORDER_IN = `'${ORDER_STATUS.AUDITED}','${ORDER_STATUS.COMPLETED}'`;

/**
 * @param {{ startDate: string, endDate: string, warehouse_code?: string }} q
 */
async function turnoverList(q) {
  const { startDate, endDate, warehouse_code } = q;
  if (!startDate || !endDate) {
    throw new HttpError(400, '请选择起止日期');
  }

  let stockSQL =
    'SELECT product_code, product_name, product_model, SUM(stock_weight) AS current_weight, SUM(stock_qty) AS current_qty FROM stock WHERE del_flag = 0 AND (stock_qty > 0 OR stock_weight > 0)';
  const stockReplacements = [];
  if (warehouse_code) {
    stockSQL += ' AND warehouse_code = ?';
    stockReplacements.push(warehouse_code);
  }
  stockSQL += ' GROUP BY product_code, product_name, product_model';

  let outboundSQL;
  const outReplacements = [startDate, endDate];
  if (warehouse_code) {
    outboundSQL = `SELECT d.product_code, SUM(d.outbound_qty) AS out_qty, SUM(d.outbound_weight) AS out_weight
     FROM outbound_order_detail d
     JOIN outbound_order o ON o.order_no = d.order_no AND o.del_flag = 0
     WHERE d.del_flag = 0 AND o.order_status IN (${ORDER_IN})
       AND o.outbound_date BETWEEN ? AND ?
       AND o.warehouse_code = ?
     GROUP BY d.product_code`;
    outReplacements.push(warehouse_code);
  } else {
    outboundSQL = `SELECT d.product_code, SUM(d.outbound_qty) AS out_qty, SUM(d.outbound_weight) AS out_weight
     FROM outbound_order_detail d
     JOIN outbound_order o ON o.order_no = d.order_no AND o.del_flag = 0
     WHERE d.del_flag = 0 AND o.order_status IN (${ORDER_IN})
       AND o.outbound_date BETWEEN ? AND ?
     GROUP BY d.product_code`;
  }

  const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReplacements });
  const [outRows] = await sequelize.query(outboundSQL, { replacements: outReplacements });

  const outMap = {};
  outRows.forEach(r => {
    outMap[r.product_code] = r;
  });

  const data = stockRows.map(s => {
    const out = outMap[s.product_code];
    const outQty = out ? Number(out.out_qty) : 0;
    const outWeight = out ? Number(out.out_weight) : 0;
    const currentQty = Number(s.current_qty) || 0;
    const currentWeight = Number(s.current_weight) || 0;
    const turnover = currentWeight > 0 ? outWeight / currentWeight : 0;
    return {
      product_code: s.product_code,
      product_name: s.product_name,
      product_model: s.product_model,
      outbound_qty: outQty,
      outbound_weight: outWeight,
      current_qty: currentQty,
      current_weight: currentWeight,
      turnover
    };
  });

  data.sort((a, b) => b.turnover - a.turnover);
  return data;
}

/**
 * @param {import('express').Response} res
 * @param {{ startDate: string, endDate: string, warehouse_code?: string }} q
 */
async function writeTurnoverWorkbookToStream(res, q) {
  const data = await turnoverList(q);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('商品周转率');
  sheet.columns = [
    { header: '商品编码', key: 'product_code', width: 15 },
    { header: '商品名称', key: 'product_name', width: 15 },
    { header: '型号', key: 'product_model', width: 15 },
    { header: '出库数量', key: 'outbound_qty', width: 12 },
    { header: '出库重量(吨)', key: 'outbound_weight', width: 15 },
    { header: '当前库存数量', key: 'current_qty', width: 15 },
    { header: '当前库存重量(吨)', key: 'current_weight', width: 18 },
    { header: '周转率', key: 'turnover', width: 12 }
  ];

  data.forEach(d => {
    sheet.addRow({
      ...d,
      turnover: d.turnover.toFixed(4)
    });
  });

  await workbook.xlsx.write(res);
}

module.exports = { turnoverList, writeTurnoverWorkbookToStream };
