'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const { ORDER_STATUS } = require('../config/constants');

const ORDER_IN = `'${ORDER_STATUS.AUDITED}','${ORDER_STATUS.COMPLETED}'`;

/**
 * @param {string|number} year
 * @returns {Promise<{ inboundMap: Record<number, object>, outboundMap: Record<number, object> }>}
 */
async function queryMonthlyMaps(year) {
  const y = year || new Date().getFullYear();

  const [inboundRows] = await sequelize.query(
    `SELECT MONTH(o.inbound_date) AS month,
            COUNT(DISTINCT o.id) AS order_count,
            COALESCE(SUM(d.inbound_weight), 0) AS total_weight,
            COALESCE(SUM(d.inbound_qty), 0) AS total_qty
     FROM inbound_order o
     LEFT JOIN inbound_order_detail d ON o.order_no = d.order_no AND d.del_flag = 0
     WHERE o.del_flag = 0 AND o.order_status IN (${ORDER_IN}) AND YEAR(o.inbound_date) = ?
     GROUP BY MONTH(o.inbound_date)
     ORDER BY month`,
    { replacements: [y] }
  );

  const [outboundRows] = await sequelize.query(
    `SELECT MONTH(o.outbound_date) AS month,
            COUNT(DISTINCT o.id) AS order_count,
            COALESCE(SUM(d.outbound_weight), 0) AS total_weight,
            COALESCE(SUM(d.outbound_qty), 0) AS total_qty
     FROM outbound_order o
     LEFT JOIN outbound_order_detail d ON o.order_no = d.order_no AND d.del_flag = 0
     WHERE o.del_flag = 0 AND o.order_status IN (${ORDER_IN}) AND YEAR(o.outbound_date) = ?
     GROUP BY MONTH(o.outbound_date)
     ORDER BY month`,
    { replacements: [y] }
  );

  const inboundMap = {};
  inboundRows.forEach(r => {
    inboundMap[r.month] = r;
  });
  const outboundMap = {};
  outboundRows.forEach(r => {
    outboundMap[r.month] = r;
  });
  return { inboundMap, outboundMap, year: y };
}

function buildMonthlyRows(inboundMap, outboundMap) {
  const data = [];
  for (let m = 1; m <= 12; m++) {
    const ib = inboundMap[m];
    const ob = outboundMap[m];
    data.push({
      month: m,
      inbound_count: ib ? Number(ib.order_count) : 0,
      inbound_weight: ib ? Number(ib.total_weight) : 0,
      inbound_qty: ib ? Number(ib.total_qty) : 0,
      outbound_count: ob ? Number(ob.order_count) : 0,
      outbound_weight: ob ? Number(ob.total_weight) : 0,
      outbound_qty: ob ? Number(ob.total_qty) : 0
    });
  }
  return data;
}

async function monthlySummaryList(year) {
  const { inboundMap, outboundMap } = await queryMonthlyMaps(year);
  return buildMonthlyRows(inboundMap, outboundMap);
}

/**
 * @param {import('express').Response} res
 * @param {string|number} year
 */
async function writeMonthlyWorkbookToStream(res, year) {
  const { inboundMap, outboundMap, year: y } = await queryMonthlyMaps(year);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${y}年月度出入库汇总`);
  sheet.columns = [
    { header: '月份', key: 'month', width: 10 },
    { header: '入库单数', key: 'inbound_count', width: 12 },
    { header: '入库重量(吨)', key: 'inbound_weight', width: 15 },
    { header: '入库数量', key: 'inbound_qty', width: 12 },
    { header: '出库单数', key: 'outbound_count', width: 12 },
    { header: '出库重量(吨)', key: 'outbound_weight', width: 15 },
    { header: '出库数量', key: 'outbound_qty', width: 12 }
  ];

  for (let m = 1; m <= 12; m++) {
    const ib = inboundMap[m] || {};
    const ob = outboundMap[m] || {};
    sheet.addRow({
      month: `${m}月`,
      inbound_count: Number(ib.order_count) || 0,
      inbound_weight: Number(ib.total_weight) || 0,
      inbound_qty: Number(ib.total_qty) || 0,
      outbound_count: Number(ob.order_count) || 0,
      outbound_weight: Number(ob.total_weight) || 0,
      outbound_qty: Number(ob.total_qty) || 0
    });
  }

  const sumRow = sheet.addRow({ month: '合计' });
  for (let col = 2; col <= 7; col++) {
    const colLetter = sheet.getColumn(col).letter;
    sumRow.getCell(col).value = { formula: `SUM(${colLetter}2:${colLetter}13)` };
  }

  await workbook.xlsx.write(res);
}

module.exports = { monthlySummaryList, writeMonthlyWorkbookToStream };
