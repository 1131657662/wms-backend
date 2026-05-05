const sequelize = require('../config/database');
const ExcelJS = require('exceljs');

// 月度出入库汇总报表
exports.monthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();

    const [inboundRows] = await sequelize.query(
      `SELECT MONTH(o.inbound_date) AS month,
              COUNT(DISTINCT o.id) AS order_count,
              COALESCE(SUM(d.inbound_weight), 0) AS total_weight,
              COALESCE(SUM(d.inbound_qty), 0) AS total_qty
       FROM inbound_order o
       LEFT JOIN inbound_order_detail d ON o.order_no = d.order_no AND d.del_flag = 0
       WHERE o.del_flag = 0 AND o.order_status IN ('audited','completed') AND YEAR(o.inbound_date) = ?
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
       WHERE o.del_flag = 0 AND o.order_status IN ('audited','completed') AND YEAR(o.outbound_date) = ?
       GROUP BY MONTH(o.outbound_date)
       ORDER BY month`,
      { replacements: [y] }
    );

    const inboundMap = {};
    inboundRows.forEach(r => { inboundMap[r.month] = r; });
    const outboundMap = {};
    outboundRows.forEach(r => { outboundMap[r.month] = r; });

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

    res.json({ code: 200, data });
  } catch (err) {
    console.error('月度汇总报表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 商品周转率统计
exports.turnover = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_code } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ code: 400, message: '请选择起止日期' });
    }

    // 当前库存（所有有库存的商品）
    let stockSQL = 'SELECT product_code, product_name, product_model, SUM(stock_weight) AS current_weight, SUM(stock_qty) AS current_qty FROM stock WHERE del_flag = 0 AND (stock_qty > 0 OR stock_weight > 0)';
    const stockReplacements = [];
    if (warehouse_code) {
      stockSQL += ' AND warehouse_code = ?';
      stockReplacements.push(warehouse_code);
    }
    stockSQL += ' GROUP BY product_code, product_name, product_model';

    // 出库数量汇总
    let outboundSQL;
    const outReplacements = [startDate, endDate];
    if (warehouse_code) {
      outboundSQL = `SELECT d.product_code, SUM(d.outbound_qty) AS out_qty, SUM(d.outbound_weight) AS out_weight
       FROM outbound_order_detail d
       JOIN outbound_order o ON o.order_no = d.order_no AND o.del_flag = 0
       WHERE d.del_flag = 0 AND o.order_status IN ('audited','completed')
         AND o.outbound_date BETWEEN ? AND ?
         AND o.warehouse_code = ?
       GROUP BY d.product_code`;
      outReplacements.push(warehouse_code);
    } else {
      outboundSQL = `SELECT d.product_code, SUM(d.outbound_qty) AS out_qty, SUM(d.outbound_weight) AS out_weight
       FROM outbound_order_detail d
       JOIN outbound_order o ON o.order_no = d.order_no AND o.del_flag = 0
       WHERE d.del_flag = 0 AND o.order_status IN ('audited','completed')
         AND o.outbound_date BETWEEN ? AND ?
       GROUP BY d.product_code`;
    }

    const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReplacements });
    const [outRows] = await sequelize.query(outboundSQL, { replacements: outReplacements });

    const outMap = {};
    outRows.forEach(r => { outMap[r.product_code] = r; });

    // 从库存出发：每个有库存的商品都显示，没出库则周转率为 0
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

    // 按周转率降序排列
    data.sort((a, b) => b.turnover - a.turnover);

    res.json({ code: 200, data });
  } catch (err) {
    console.error('商品周转率报表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 月度汇总导出 Excel
exports.exportMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();

    const [inboundRows] = await sequelize.query(
      `SELECT MONTH(o.inbound_date) AS month,
              COUNT(DISTINCT o.id) AS order_count,
              COALESCE(SUM(d.inbound_weight), 0) AS total_weight,
              COALESCE(SUM(d.inbound_qty), 0) AS total_qty
       FROM inbound_order o
       LEFT JOIN inbound_order_detail d ON o.order_no = d.order_no AND d.del_flag = 0
       WHERE o.del_flag = 0 AND o.order_status IN ('audited','completed') AND YEAR(o.inbound_date) = ?
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
       WHERE o.del_flag = 0 AND o.order_status IN ('audited','completed') AND YEAR(o.outbound_date) = ?
       GROUP BY MONTH(o.outbound_date)
       ORDER BY month`,
      { replacements: [y] }
    );

    const inboundMap = {};
    inboundRows.forEach(r => { inboundMap[r.month] = r; });
    const outboundMap = {};
    outboundRows.forEach(r => { outboundMap[r.month] = r; });

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

    // 合计行
    const sumRow = sheet.addRow({ month: '合计' });
    for (let col = 2; col <= 7; col++) {
      const colLetter = sheet.getColumn(col).letter;
      sumRow.getCell(col).value = { formula: `SUM(${colLetter}2:${colLetter}13)` };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(y + '年月度出入库汇总.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出月度汇总失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 周转率导出 Excel
exports.exportTurnover = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_code } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ code: 400, message: '请选择起止日期' });
    }

    let stockSQL = 'SELECT product_code, product_name, product_model, SUM(stock_weight) AS current_weight, SUM(stock_qty) AS current_qty FROM stock WHERE del_flag = 0 AND (stock_qty > 0 OR stock_weight > 0)';
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
       WHERE d.del_flag = 0 AND o.order_status IN ('audited','completed')
         AND o.outbound_date BETWEEN ? AND ?
         AND o.warehouse_code = ?
       GROUP BY d.product_code`;
      outReplacements.push(warehouse_code);
    } else {
      outboundSQL = `SELECT d.product_code, SUM(d.outbound_qty) AS out_qty, SUM(d.outbound_weight) AS out_weight
       FROM outbound_order_detail d
       JOIN outbound_order o ON o.order_no = d.order_no AND o.del_flag = 0
       WHERE d.del_flag = 0 AND o.order_status IN ('audited','completed')
         AND o.outbound_date BETWEEN ? AND ?
       GROUP BY d.product_code`;
    }

    const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReplacements });
    const [outRows] = await sequelize.query(outboundSQL, { replacements: outReplacements });

    const outMap = {};
    outRows.forEach(r => { outMap[r.product_code] = r; });

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

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('商品周转率统计.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出周转率失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// ==================== 入库明细报表 ====================

// 入库明细查询
exports.inboundDetail = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate, warehouse_code, supplier_code, product_code, product_name, product_model, order_status, keyword } = req.query;
    const p = parseInt(page), ps = Math.min(parseInt(pageSize) || 20, 200);

    let where = `WHERE o.del_flag = 0 AND d.del_flag = 0`;
    const replacements = [];

    if (startDate) { where += ` AND o.inbound_date >= ?`; replacements.push(startDate); }
    if (endDate) { where += ` AND o.inbound_date <= ?`; replacements.push(endDate); }
    if (warehouse_code) { where += ` AND o.warehouse_code = ?`; replacements.push(warehouse_code); }
    if (supplier_code) { where += ` AND o.supplier_code = ?`; replacements.push(supplier_code); }
    if (product_code) { where += ` AND d.product_code LIKE ?`; replacements.push(`%${product_code}%`); }
    if (product_name) { where += ` AND d.product_name LIKE ?`; replacements.push(`%${product_name}%`); }
    if (product_model) { where += ` AND d.product_model LIKE ?`; replacements.push(`%${product_model}%`); }
    if (order_status) { where += ` AND o.order_status = ?`; replacements.push(order_status); }
    if (keyword) { where += ` AND o.order_no LIKE ?`; replacements.push(`%${keyword}%`); }

    const countSQL = `SELECT COUNT(*) AS total FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no ${where}`;
    const dataSQL = `SELECT d.id, o.order_no, o.inbound_date, o.warehouse_code, o.supplier_code, o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.delivery_no, o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.inbound_qty, d.inbound_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.inbound_date DESC, o.order_no DESC LIMIT ? OFFSET ?`;

    const [[{ total }]] = await sequelize.query(countSQL, { replacements });
    const [rows] = await sequelize.query(dataSQL, { replacements: [...replacements, ps, (p - 1) * ps] });

    // 批量解析名称
    const whCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
    const spCodes = [...new Set(rows.map(r => r.supplier_code).filter(Boolean))];
    const whMap = {}, spMap = {};
    if (whCodes.length) {
      const [whs] = await sequelize.query(`SELECT warehouse_code, warehouse_name FROM warehouse WHERE warehouse_code IN (?)`, { replacements: [whCodes] });
      whs.forEach(w => { whMap[w.warehouse_code] = w.warehouse_name; });
    }
    if (spCodes.length) {
      const [sps] = await sequelize.query(`SELECT supplier_code, supplier_name FROM supplier WHERE supplier_code IN (?)`, { replacements: [spCodes] });
      sps.forEach(s => { spMap[s.supplier_code] = s.supplier_name; });
    }

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

    res.json({ code: 200, data: { list, total, page: p, pageSize: ps } });
  } catch (err) {
    console.error('入库明细报表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 入库明细导出 Excel
exports.exportInboundDetail = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_code, supplier_code, product_code, product_name, product_model, order_status, keyword } = req.query;

    let where = `WHERE o.del_flag = 0 AND d.del_flag = 0`;
    const replacements = [];

    if (startDate) { where += ` AND o.inbound_date >= ?`; replacements.push(startDate); }
    if (endDate) { where += ` AND o.inbound_date <= ?`; replacements.push(endDate); }
    if (warehouse_code) { where += ` AND o.warehouse_code = ?`; replacements.push(warehouse_code); }
    if (supplier_code) { where += ` AND o.supplier_code = ?`; replacements.push(supplier_code); }
    if (product_code) { where += ` AND d.product_code LIKE ?`; replacements.push(`%${product_code}%`); }
    if (product_name) { where += ` AND d.product_name LIKE ?`; replacements.push(`%${product_name}%`); }
    if (product_model) { where += ` AND d.product_model LIKE ?`; replacements.push(`%${product_model}%`); }
    if (order_status) { where += ` AND o.order_status = ?`; replacements.push(order_status); }
    if (keyword) { where += ` AND o.order_no LIKE ?`; replacements.push(`%${keyword}%`); }

    const dataSQL = `SELECT d.id, o.order_no, o.inbound_date, o.warehouse_code, o.supplier_code, o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.delivery_no, o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.inbound_qty, d.inbound_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.inbound_date DESC, o.order_no DESC LIMIT 10000`;

    const [rows] = await sequelize.query(dataSQL, { replacements });

    const whCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
    const spCodes = [...new Set(rows.map(r => r.supplier_code).filter(Boolean))];
    const whMap = {}, spMap = {};
    if (whCodes.length) {
      const [whs] = await sequelize.query(`SELECT warehouse_code, warehouse_name FROM warehouse WHERE warehouse_code IN (?)`, { replacements: [whCodes] });
      whs.forEach(w => { whMap[w.warehouse_code] = w.warehouse_name; });
    }
    if (spCodes.length) {
      const [sps] = await sequelize.query(`SELECT supplier_code, supplier_name FROM supplier WHERE supplier_code IN (?)`, { replacements: [spCodes] });
      sps.forEach(s => { spMap[s.supplier_code] = s.supplier_name; });
    }

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
    const statusMap = { draft: '草稿', submit: '已提交', audited: '已审核', completed: '已完成' };
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
        order_status: statusMap[r.order_status] || r.order_status,
        remark: r.order_remark
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('入库明细报表.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出入库明细失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// ==================== 出库明细报表 ====================

// 出库明细查询
exports.outboundDetail = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate, warehouse_code, customer_code, product_code, product_name, product_model, order_status, keyword } = req.query;
    const p = parseInt(page), ps = Math.min(parseInt(pageSize) || 20, 200);

    let where = `WHERE o.del_flag = 0 AND d.del_flag = 0`;
    const replacements = [];

    if (startDate) { where += ` AND o.outbound_date >= ?`; replacements.push(startDate); }
    if (endDate) { where += ` AND o.outbound_date <= ?`; replacements.push(endDate); }
    if (warehouse_code) { where += ` AND o.warehouse_code = ?`; replacements.push(warehouse_code); }
    if (customer_code) { where += ` AND o.customer_code = ?`; replacements.push(customer_code); }
    if (product_code) { where += ` AND d.product_code LIKE ?`; replacements.push(`%${product_code}%`); }
    if (product_name) { where += ` AND d.product_name LIKE ?`; replacements.push(`%${product_name}%`); }
    if (product_model) { where += ` AND d.product_model LIKE ?`; replacements.push(`%${product_model}%`); }
    if (order_status) { where += ` AND o.order_status = ?`; replacements.push(order_status); }
    if (keyword) { where += ` AND o.order_no LIKE ?`; replacements.push(`%${keyword}%`); }

    const countSQL = `SELECT COUNT(*) AS total FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no ${where}`;
    const dataSQL = `SELECT d.id, o.order_no, o.outbound_date, o.warehouse_code, o.customer_code, o.customer_name, d.contract_no,
      o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.contact_person, o.contact_phone,
      o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.outbound_qty, d.outbound_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.outbound_date DESC, o.order_no DESC LIMIT ? OFFSET ?`;

    const [[{ total }]] = await sequelize.query(countSQL, { replacements });
    const [rows] = await sequelize.query(dataSQL, { replacements: [...replacements, ps, (p - 1) * ps] });

    const whCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
    const whMap = {};
    if (whCodes.length) {
      const [whs] = await sequelize.query(`SELECT warehouse_code, warehouse_name FROM warehouse WHERE warehouse_code IN (?)`, { replacements: [whCodes] });
      whs.forEach(w => { whMap[w.warehouse_code] = w.warehouse_name; });
    }

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

    res.json({ code: 200, data: { list, total, page: p, pageSize: ps } });
  } catch (err) {
    console.error('出库明细报表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 出库明细导出 Excel
exports.exportOutboundDetail = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_code, customer_code, product_code, product_name, product_model, order_status, keyword } = req.query;

    let where = `WHERE o.del_flag = 0 AND d.del_flag = 0`;
    const replacements = [];

    if (startDate) { where += ` AND o.outbound_date >= ?`; replacements.push(startDate); }
    if (endDate) { where += ` AND o.outbound_date <= ?`; replacements.push(endDate); }
    if (warehouse_code) { where += ` AND o.warehouse_code = ?`; replacements.push(warehouse_code); }
    if (customer_code) { where += ` AND o.customer_code = ?`; replacements.push(customer_code); }
    if (product_code) { where += ` AND d.product_code LIKE ?`; replacements.push(`%${product_code}%`); }
    if (product_name) { where += ` AND d.product_name LIKE ?`; replacements.push(`%${product_name}%`); }
    if (product_model) { where += ` AND d.product_model LIKE ?`; replacements.push(`%${product_model}%`); }
    if (order_status) { where += ` AND o.order_status = ?`; replacements.push(order_status); }
    if (keyword) { where += ` AND o.order_no LIKE ?`; replacements.push(`%${keyword}%`); }

    const dataSQL = `SELECT d.id, o.order_no, o.outbound_date, o.warehouse_code, o.customer_code, o.customer_name, d.contract_no,
      o.order_status, o.remark AS order_remark,
      o.vehicle_no, o.container_no, o.bill_type_code, o.contact_person, o.contact_phone,
      o.create_by, o.create_time, o.audit_by, o.audit_time,
      d.product_code, d.product_name, d.product_model, d.outbound_qty, d.outbound_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no ${where}
      ORDER BY o.outbound_date DESC, o.order_no DESC LIMIT 10000`;

    const [rows] = await sequelize.query(dataSQL, { replacements });

    const whCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
    const cuCodes = [...new Set(rows.map(r => r.customer_code).filter(Boolean))];
    const whMap = {}, cuMap = {};
    if (whCodes.length) {
      const [whs] = await sequelize.query(`SELECT warehouse_code, warehouse_name FROM warehouse WHERE warehouse_code IN (?)`, { replacements: [whCodes] });
      whs.forEach(w => { whMap[w.warehouse_code] = w.warehouse_name; });
    }
    if (cuCodes.length) {
      const [cus] = await sequelize.query(`SELECT customer_code, customer_name FROM customer WHERE customer_code IN (?)`, { replacements: [cuCodes] });
      cus.forEach(c => { cuMap[c.customer_code] = c.customer_name; });
    }

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
    const statusMap = { draft: '草稿', submit: '已提交', audited: '已审核', completed: '已完成' };
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
        order_status: statusMap[r.order_status] || r.order_status,
        remark: r.order_remark
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('出库明细报表.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出出库明细失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// ==================== 进销存台账 ====================

// 进销存台账查询
exports.stockJournal = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate, warehouse_name, product_code, business_type } = req.query;
    const p = parseInt(page), ps = Math.min(parseInt(pageSize) || 20, 200);

    let where = `WHERE 1=1`;
    const replacements = [];

    if (startDate) { where += ` AND create_time >= ?`; replacements.push(startDate); }
    if (endDate) { where += ` AND create_time <= ?`; replacements.push(endDate + ' 23:59:59'); }
    if (warehouse_name) { where += ` AND warehouse_name LIKE ?`; replacements.push(`%${warehouse_name}%`); }
    if (product_code) { where += ` AND product_code LIKE ?`; replacements.push(`%${product_code}%`); }
    if (business_type) { where += ` AND business_type = ?`; replacements.push(business_type); }

    const countSQL = `SELECT COUNT(*) AS total FROM stock_journal ${where}`;
    const dataSQL = `SELECT * FROM stock_journal ${where} ORDER BY create_time DESC, id DESC LIMIT ? OFFSET ?`;

    const [[{ total }]] = await sequelize.query(countSQL, { replacements });
    const [rows] = await sequelize.query(dataSQL, { replacements: [...replacements, ps, (p - 1) * ps] });

    const bizTypeMap = { inbound: '入库', outbound: '出库', check: '盘点', init: '初始化', import: '导入' };
    const list = rows.map(r => ({
      id: r.id,
      create_time: r.create_time,
      warehouse_name: r.warehouse_name,
      product_code: r.product_code,
      product_name: r.product_name,
      product_model: r.product_model,
      business_type: bizTypeMap[r.business_type] || r.business_type,
      order_no: r.order_no,
      change_qty: r.change_qty,
      change_weight: r.change_weight,
      before_qty: r.before_qty,
      before_weight: r.before_weight,
      after_qty: r.after_qty,
      after_weight: r.after_weight,
      remark: r.remark
    }));

    res.json({ code: 200, data: { list, total, page: p, pageSize: ps } });
  } catch (err) {
    console.error('进销存台账失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 进销存台账导出 Excel
exports.exportStockJournal = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_name, product_code, business_type } = req.query;

    let where = `WHERE 1=1`;
    const replacements = [];

    if (startDate) { where += ` AND create_time >= ?`; replacements.push(startDate); }
    if (endDate) { where += ` AND create_time <= ?`; replacements.push(endDate + ' 23:59:59'); }
    if (warehouse_name) { where += ` AND warehouse_name LIKE ?`; replacements.push(`%${warehouse_name}%`); }
    if (product_code) { where += ` AND product_code LIKE ?`; replacements.push(`%${product_code}%`); }
    if (business_type) { where += ` AND business_type = ?`; replacements.push(business_type); }

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
    const bizTypeMap = { inbound: '入库', outbound: '出库', check: '盘点', init: '初始化', import: '导入' };
    rows.forEach(r => {
      sheet.addRow({
        create_time: r.create_time ? new Date(r.create_time).toLocaleString('zh-CN') : '',
        warehouse_name: r.warehouse_name,
        product_code: r.product_code,
        product_name: r.product_name,
        product_model: r.product_model,
        business_type: bizTypeMap[r.business_type] || r.business_type,
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

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('进销存台账.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出进销存台账失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// ==================== 收发存汇总表 ====================

// 收发存汇总查询
exports.periodSummary = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_code } = req.query;

    // 当前库存（期末）- LEFT JOIN 仓库表获取名称，避免编码/名称混用
    let stockSQL = `SELECT s.warehouse_code, COALESCE(w.warehouse_name, s.warehouse_code) AS warehouse_name, s.product_code, s.product_name, s.product_model, SUM(s.stock_qty) AS end_qty, SUM(s.stock_weight) AS end_weight FROM stock s LEFT JOIN warehouse w ON w.warehouse_code = s.warehouse_code WHERE s.del_flag = 0 AND (s.stock_qty > 0 OR s.stock_weight > 0)`;
    const stockReps = [];
    if (warehouse_code) { stockSQL += ` AND s.warehouse_code = ?`; stockReps.push(warehouse_code); }
    stockSQL += ` GROUP BY s.warehouse_code, w.warehouse_name, s.product_code, s.product_name, s.product_model`;
    const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReps });

    // 入库合计（时间段内，审核通过的单据）
    let inSQL = `SELECT o.warehouse_code, d.product_code, COALESCE(SUM(d.inbound_qty),0) AS in_qty, COALESCE(SUM(d.inbound_weight),0) AS in_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN ('audited','completed')`;
    const inReps = [];
    if (startDate) { inSQL += ` AND o.inbound_date >= ?`; inReps.push(startDate); }
    if (endDate) { inSQL += ` AND o.inbound_date <= ?`; inReps.push(endDate); }
    if (warehouse_code) { inSQL += ` AND o.warehouse_code = ?`; inReps.push(warehouse_code); }
    inSQL += ` GROUP BY o.warehouse_code, d.product_code`;
    const [inRows] = await sequelize.query(inSQL, { replacements: inReps });

    // 出库合计（时间段内）
    let outSQL = `SELECT o.warehouse_code, d.product_code, COALESCE(SUM(d.outbound_qty),0) AS out_qty, COALESCE(SUM(d.outbound_weight),0) AS out_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN ('audited','completed')`;
    const outReps = [];
    if (startDate) { outSQL += ` AND o.outbound_date >= ?`; outReps.push(startDate); }
    if (endDate) { outSQL += ` AND o.outbound_date <= ?`; outReps.push(endDate); }
    if (warehouse_code) { outSQL += ` AND o.warehouse_code = ?`; outReps.push(warehouse_code); }
    outSQL += ` GROUP BY o.warehouse_code, d.product_code`;
    const [outRows] = await sequelize.query(outSQL, { replacements: outReps });

    // 构建查找表
    const inMap = {};
    inRows.forEach(r => { inMap[r.warehouse_code + '|' + r.product_code] = r; });
    const outMap = {};
    outRows.forEach(r => { outMap[r.warehouse_code + '|' + r.product_code] = r; });

    // JS 合并: 期初 = 期末 - 入库 + 出库（warehouse_name 已从 SQL LEFT JOIN 获取）
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

    res.json({ code: 200, data });
  } catch (err) {
    console.error('收发存汇总报表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 收发存汇总导出 Excel
exports.exportPeriodSummary = async (req, res) => {
  try {
    const { startDate, endDate, warehouse_code } = req.query;

    let stockSQL = `SELECT s.warehouse_code, COALESCE(w.warehouse_name, s.warehouse_code) AS warehouse_name, s.product_code, s.product_name, s.product_model, SUM(s.stock_qty) AS end_qty, SUM(s.stock_weight) AS end_weight FROM stock s LEFT JOIN warehouse w ON w.warehouse_code = s.warehouse_code WHERE s.del_flag = 0 AND (s.stock_qty > 0 OR s.stock_weight > 0)`;
    const stockReps = [];
    if (warehouse_code) { stockSQL += ` AND s.warehouse_code = ?`; stockReps.push(warehouse_code); }
    stockSQL += ` GROUP BY s.warehouse_code, w.warehouse_name, s.product_code, s.product_name, s.product_model`;
    const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReps });

    let inSQL = `SELECT o.warehouse_code, d.product_code, COALESCE(SUM(d.inbound_qty),0) AS in_qty, COALESCE(SUM(d.inbound_weight),0) AS in_weight
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN ('audited','completed')`;
    const inReps = [];
    if (startDate) { inSQL += ` AND o.inbound_date >= ?`; inReps.push(startDate); }
    if (endDate) { inSQL += ` AND o.inbound_date <= ?`; inReps.push(endDate); }
    if (warehouse_code) { inSQL += ` AND o.warehouse_code = ?`; inReps.push(warehouse_code); }
    inSQL += ` GROUP BY o.warehouse_code, d.product_code`;
    const [inRows] = await sequelize.query(inSQL, { replacements: inReps });

    let outSQL = `SELECT o.warehouse_code, d.product_code, COALESCE(SUM(d.outbound_qty),0) AS out_qty, COALESCE(SUM(d.outbound_weight),0) AS out_weight
      FROM outbound_order_detail d JOIN outbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN ('audited','completed')`;
    const outReps = [];
    if (startDate) { outSQL += ` AND o.outbound_date >= ?`; outReps.push(startDate); }
    if (endDate) { outSQL += ` AND o.outbound_date <= ?`; outReps.push(endDate); }
    if (warehouse_code) { outSQL += ` AND o.warehouse_code = ?`; outReps.push(warehouse_code); }
    outSQL += ` GROUP BY o.warehouse_code, d.product_code`;
    const [outRows] = await sequelize.query(outSQL, { replacements: outReps });

    const inMap = {};
    inRows.forEach(r => { inMap[r.warehouse_code + '|' + r.product_code] = r; });
    const outMap = {};
    outRows.forEach(r => { outMap[r.warehouse_code + '|' + r.product_code] = r; });

    const data = stockRows.map(s => {
      const key = s.warehouse_code + '|' + s.product_code;
      const ib = inMap[key], ob = outMap[key];
      const inQty = ib ? Number(ib.in_qty) : 0;
      const inWeight = ib ? Number(ib.in_weight) : 0;
      const outQty = ob ? Number(ob.out_qty) : 0;
      const outWeight = ob ? Number(ob.out_weight) : 0;
      const endQty = Number(s.end_qty) || 0;
      const endWeight = Number(s.end_weight) || 0;
      return {
        warehouse_name: s.warehouse_name,
        product_code: s.product_code,
        product_name: s.product_name,
        product_model: s.product_model,
        begin_qty: endQty - inQty + outQty,
        begin_weight: endWeight - inWeight + outWeight,
        in_qty: inQty,
        in_weight: inWeight,
        out_qty: outQty,
        out_weight: outWeight,
        end_qty: endQty,
        end_weight: endWeight
      };
    });

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
    data.forEach(r => sheet.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('收发存汇总表.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出收发存汇总失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// ==================== 库龄分析报表 ====================

// 库龄分析查询
exports.stockAging = async (req, res) => {
  try {
    const { warehouse_code, product_code, aging_range } = req.query;

    // 当前库存 - LEFT JOIN 仓库表获取名称
    let stockSQL = `SELECT s.warehouse_code, COALESCE(w.warehouse_name, s.warehouse_code) AS warehouse_name, s.product_code, s.product_name, s.product_model, SUM(s.stock_qty) AS current_qty, SUM(s.stock_weight) AS current_weight FROM stock s LEFT JOIN warehouse w ON w.warehouse_code = s.warehouse_code WHERE s.del_flag = 0 AND (s.stock_qty > 0 OR s.stock_weight > 0)`;
    const stockReps = [];
    if (warehouse_code) { stockSQL += ` AND s.warehouse_code = ?`; stockReps.push(warehouse_code); }
    if (product_code) { stockSQL += ` AND s.product_code LIKE ?`; stockReps.push(`%${product_code}%`); }
    stockSQL += ` GROUP BY s.warehouse_code, w.warehouse_name, s.product_code, s.product_name, s.product_model`;
    const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReps });

    // 批量查最后入库日期
    let lastInSQL = `SELECT o.warehouse_code, d.product_code, MAX(o.inbound_date) AS last_inbound_date
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN ('audited','completed')
      GROUP BY o.warehouse_code, d.product_code`;
    const [lastInRows] = await sequelize.query(lastInSQL);
    const lastInMap = {};
    lastInRows.forEach(r => { lastInMap[r.warehouse_code + '|' + r.product_code] = r.last_inbound_date; });

    const now = new Date();
    const data = stockRows.map(s => {
      const lastIn = lastInMap[s.warehouse_code + '|' + s.product_code];
      const age = lastIn ? Math.floor((now - new Date(lastIn)) / 86400000) : 999;
      let range = '';
      if (age <= 30) range = '0-30天';
      else if (age <= 60) range = '31-60天';
      else if (age <= 90) range = '61-90天';
      else range = '91天以上';
      return {
        warehouse_name: s.warehouse_name,
        product_code: s.product_code,
        product_name: s.product_name,
        product_model: s.product_model,
        current_qty: Number(s.current_qty),
        current_weight: Number(s.current_weight),
        last_inbound_date: lastIn || null,
        age_days: age,
        aging_range: range
      };
    });

    // 按库龄降序排列
    data.sort((a, b) => b.age_days - a.age_days);

    // 库龄区间筛选
    const filtered = aging_range ? data.filter(d => d.aging_range === aging_range) : data;

    res.json({ code: 200, data: filtered });
  } catch (err) {
    console.error('库龄分析报表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 库龄分析导出 Excel
exports.exportStockAging = async (req, res) => {
  try {
    const { warehouse_code, product_code, aging_range } = req.query;

    let stockSQL = `SELECT s.warehouse_code, COALESCE(w.warehouse_name, s.warehouse_code) AS warehouse_name, s.product_code, s.product_name, s.product_model, SUM(s.stock_qty) AS current_qty, SUM(s.stock_weight) AS current_weight FROM stock s LEFT JOIN warehouse w ON w.warehouse_code = s.warehouse_code WHERE s.del_flag = 0 AND (s.stock_qty > 0 OR s.stock_weight > 0)`;
    const stockReps = [];
    if (warehouse_code) { stockSQL += ` AND s.warehouse_code = ?`; stockReps.push(warehouse_code); }
    if (product_code) { stockSQL += ` AND s.product_code LIKE ?`; stockReps.push(`%${product_code}%`); }
    stockSQL += ` GROUP BY s.warehouse_code, w.warehouse_name, s.product_code, s.product_name, s.product_model`;
    const [stockRows] = await sequelize.query(stockSQL, { replacements: stockReps });

    let lastInSQL = `SELECT o.warehouse_code, d.product_code, MAX(o.inbound_date) AS last_inbound_date
      FROM inbound_order_detail d JOIN inbound_order o ON o.order_no = d.order_no
      WHERE o.del_flag = 0 AND d.del_flag = 0 AND o.order_status IN ('audited','completed')
      GROUP BY o.warehouse_code, d.product_code`;
    const [lastInRows] = await sequelize.query(lastInSQL);
    const lastInMap = {};
    lastInRows.forEach(r => { lastInMap[r.warehouse_code + '|' + r.product_code] = r.last_inbound_date; });

    const now = new Date();
    let data = stockRows.map(s => {
      const lastIn = lastInMap[s.warehouse_code + '|' + s.product_code];
      const age = lastIn ? Math.floor((now - new Date(lastIn)) / 86400000) : 999;
      let range = '';
      if (age <= 30) range = '0-30天';
      else if (age <= 60) range = '31-60天';
      else if (age <= 90) range = '61-90天';
      else range = '91天以上';
      return {
        warehouse_name: s.warehouse_name,
        product_code: s.product_code,
        product_name: s.product_name,
        product_model: s.product_model,
        current_qty: Number(s.current_qty),
        current_weight: Number(s.current_weight),
        last_inbound_date: lastIn ? new Date(lastIn).toISOString().slice(0, 10) : '无记录',
        age_days: age,
        aging_range: range
      };
    });

    data.sort((a, b) => b.age_days - a.age_days);
    if (aging_range) data = data.filter(d => d.aging_range === aging_range);

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

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('库龄分析报表.xlsx')}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出库龄分析失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
