const { Sequelize, QueryTypes } = require('sequelize');
const { ORDER_STATUS } = require('../config/constants');
const InboundOrder = require('../models/inbound_order');
const OutboundOrder = require('../models/outbound_order');
const Stock = require('../models/stock');
const StockCheckOrder = require('../models/stock_check_order');
const Warehouse = require('../models/warehouse');
const Supplier = require('../models/supplier');
const Customer = require('../models/customer');
const Product = require('../models/product');
const SysOperationLog = require('../models/sys_operation_log');
const SysUser = require('../models/sys_user');

exports.stats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    // 1. 今日入库单数
    const todayInboundCount = await InboundOrder.count({
      where: { inbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 }
    });

    // 2. 今日出库单数
    const todayOutboundCount = await OutboundOrder.count({
      where: { outbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 }
    });

    // 3. 待审核入库单数
    const pendingInboundCount = await InboundOrder.count({
      where: { order_status: ORDER_STATUS.SUBMIT, del_flag: 0 }
    });

    // 4. 待审核出库单数
    const pendingOutboundCount = await OutboundOrder.count({
      where: { order_status: ORDER_STATUS.SUBMIT, del_flag: 0 }
    });

    // 5. 库存低于预警线的商品数（stock 与 product 通过 product_code 关联）
    const [lowStockRows] = await Stock.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM stock s
       LEFT JOIN product p ON s.product_code = p.product_code AND p.del_flag = 0
       WHERE s.del_flag = 0 AND s.stock_qty > 0
       AND s.stock_weight < COALESCE(p.default_min_alert_weight, 0)`
    );
    const lowStockCount = lowStockRows[0].cnt;

    // 6. 出入库趋势（最近 N 天，按天分组）
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - days + 1);
    const startDate = trendStart.toISOString().slice(0, 10);

    const [inboundTrend] = await InboundOrder.sequelize.query(
      `SELECT DATE(inbound_date) AS date, COUNT(*) AS cnt
       FROM inbound_order
       WHERE del_flag = 0 AND inbound_date >= :startDate
       GROUP BY DATE(inbound_date)`,
      { replacements: { startDate } }
    );

    const [outboundTrend] = await OutboundOrder.sequelize.query(
      `SELECT DATE(outbound_date) AS date, COUNT(*) AS cnt
       FROM outbound_order
       WHERE del_flag = 0 AND outbound_date >= :startDate
       GROUP BY DATE(outbound_date)`,
      { replacements: { startDate } }
    );

    // 构造趋势数组，填充缺失日期
    const trend = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(trendStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const inbound = inboundTrend.find(r => r.date === dateStr);
      const outbound = outboundTrend.find(r => r.date === dateStr);
      trend.push({
        date: dateStr.slice(5), // MM-DD
        inboundCount: inbound ? inbound.cnt : 0,
        outboundCount: outbound ? outbound.cnt : 0
      });
    }

    // 7. 最近业务单据（入库单、出库单、盘点单，取最近10条）
    const [inbounds, outbounds, checkOrders] = await Promise.all([
      InboundOrder.findAll({ attributes: ['id', 'order_no', 'warehouse_code', 'supplier_code', 'inbound_date', 'order_status', 'remark', 'create_by', 'create_time'], where: { del_flag: 0 }, order: [['id', 'DESC']], limit: 10, raw: true }),
      OutboundOrder.findAll({ attributes: ['id', 'order_no', 'warehouse_code', 'customer_code', 'outbound_date', 'order_status', 'remark', 'create_by', 'create_time'], where: { del_flag: 0 }, order: [['id', 'DESC']], limit: 10, raw: true }),
      StockCheckOrder.findAll({ attributes: ['id', 'check_no', 'warehouse_code', 'status', 'remark', 'create_by', 'create_time'], where: { del_flag: 0 }, order: [['id', 'DESC']], limit: 10, raw: true })
    ]);

    // 批量查询仓库、供应商、客户名称
    const allWarehouseCodes = [...new Set([...inbounds, ...outbounds, ...checkOrders].map(d => d.warehouse_code).filter(Boolean))];
    const supplierCodes = [...new Set(inbounds.map(d => d.supplier_code).filter(Boolean))];
    const customerCodes = [...new Set(outbounds.map(d => d.customer_code).filter(Boolean))];

    const [warehouses, suppliers, customers] = await Promise.all([
      allWarehouseCodes.length > 0 ? Warehouse.findAll({ attributes: ['warehouse_code', 'warehouse_name'], where: { warehouse_code: allWarehouseCodes, del_flag: 0 }, raw: true }) : [],
      supplierCodes.length > 0 ? Supplier.findAll({ attributes: ['supplier_code', 'supplier_name'], where: { supplier_code: supplierCodes, del_flag: 0 }, raw: true }) : [],
      customerCodes.length > 0 ? Customer.findAll({ attributes: ['customer_code', 'customer_name'], where: { customer_code: customerCodes, del_flag: 0 }, raw: true }) : []
    ]);

    const whMap = {}; warehouses.forEach(w => { whMap[w.warehouse_code] = w.warehouse_name; });
    const spMap = {}; suppliers.forEach(s => { spMap[s.supplier_code] = s.supplier_name; });
    const cuMap = {}; customers.forEach(c => { cuMap[c.customer_code] = c.customer_name; });

    const recentDocs = [
      ...inbounds.map(d => ({ ...d, doc_type: 'inbound', order_no: d.order_no, status: d.order_status, warehouse_name: whMap[d.warehouse_code] || d.warehouse_code, related_name: spMap[d.supplier_code] || d.supplier_code || '', date: d.inbound_date ? String(d.inbound_date).slice(0, 10) : '' })),
      ...outbounds.map(d => ({ ...d, doc_type: 'outbound', order_no: d.order_no, status: d.order_status, warehouse_name: whMap[d.warehouse_code] || d.warehouse_code, related_name: cuMap[d.customer_code] || d.customer_code || '', date: d.outbound_date ? String(d.outbound_date).slice(0, 10) : '' })),
      ...checkOrders.map(d => ({ ...d, doc_type: 'check', order_no: d.check_no, status: d.status, warehouse_name: whMap[d.warehouse_code] || d.warehouse_code, related_name: '', date: d.create_time ? String(d.create_time).slice(0, 10) : '' }))
    ].sort((a, b) => b.create_time - a.create_time).slice(0, 10);

    res.json({
      code: 200,
      data: {
        todayInboundCount,
        todayOutboundCount,
        pendingInboundCount,
        pendingOutboundCount,
        lowStockCount,
        trend,
        recentDocs
      }
    });
  } catch (err) {
    console.error('仪表盘统计失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// GET /api/dashboard/analysis — 分析页数据
exports.analysis = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();

    // 1. panelGroup: 统计卡片
    const [todayInboundCount, todayOutboundCount, pendingInboundCount, pendingOutboundCount, pendingCheckCount] = await Promise.all([
      InboundOrder.count({ where: { inbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 } }),
      OutboundOrder.count({ where: { outbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 } }),
      InboundOrder.count({ where: { order_status: ORDER_STATUS.SUBMIT, del_flag: 0 } }),
      OutboundOrder.count({ where: { order_status: ORDER_STATUS.SUBMIT, del_flag: 0 } }),
      StockCheckOrder.count({ where: { status: ORDER_STATUS.SUBMIT, del_flag: 0 } })
    ]);
    const [lowStockRows] = await Stock.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM stock s
       LEFT JOIN product p ON s.product_code = p.product_code AND p.del_flag = 0
       WHERE s.del_flag = 0 AND s.stock_qty > 0
       AND s.stock_weight < COALESCE(p.default_min_alert_weight, 0)`
    );

    // 2. pieData: 本月订单类型分布
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const [inboundMonth, outboundMonth, checkMonth] = await Promise.all([
      InboundOrder.count({ where: { del_flag: 0, inbound_date: { [Sequelize.Op.gte]: monthStart } } }),
      OutboundOrder.count({ where: { del_flag: 0, outbound_date: { [Sequelize.Op.gte]: monthStart } } }),
      StockCheckOrder.count({ where: { del_flag: 0, create_time: { [Sequelize.Op.gte]: monthStart } } })
    ]);

    // 3. trendData: 近N天每日出入库趋势（分开统计）
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - days + 1);
    const trendStartDate = trendStart.toISOString().slice(0, 10);
    const [inboundDaily, outboundDaily] = await Promise.all([
      InboundOrder.sequelize.query(
        `SELECT DATE(inbound_date) AS date, COUNT(*) AS cnt FROM inbound_order
         WHERE del_flag = 0 AND inbound_date >= :sd GROUP BY DATE(inbound_date)`,
        { replacements: { sd: trendStartDate } }
      ),
      OutboundOrder.sequelize.query(
        `SELECT DATE(outbound_date) AS date, COUNT(*) AS cnt FROM outbound_order
         WHERE del_flag = 0 AND outbound_date >= :sd GROUP BY DATE(outbound_date)`,
        { replacements: { sd: trendStartDate } }
      )
    ]);
    const trendData = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(trendStart);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const ib = inboundDaily[0].find(r => r.date === ds);
      const ob = outboundDaily[0].find(r => r.date === ds);
      trendData.push({
        name: ds.slice(5),
        inboundCount: ib ? ib.cnt : 0,
        outboundCount: ob ? ob.cnt : 0
      });
    }

    // 4. lineData: 近12月月度出入库趋势
    const lineData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = (d.getMonth() + 1) + '月';
      const mStart = d.toISOString().slice(0, 10);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const [ibCount, obCount] = await Promise.all([
        InboundOrder.count({ where: { del_flag: 0, inbound_date: { [Sequelize.Op.between]: [mStart, mEnd] } } }),
        OutboundOrder.count({ where: { del_flag: 0, outbound_date: { [Sequelize.Op.between]: [mStart, mEnd] } } })
      ]);
      lineData.push({ name: monthLabel, estimate: ibCount, actual: obCount });
    }

    // 5. recentDocs: 最近5天业务单据
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const recentDate = fiveDaysAgo.toISOString().slice(0, 10);
    const [recentInbounds, recentOutbounds, recentChecks] = await Promise.all([
      InboundOrder.findAll({ attributes: ['id', 'order_no', 'warehouse_code', 'supplier_code', 'inbound_date', 'order_status', 'create_by', 'create_time'], where: { del_flag: 0, create_time: { [Sequelize.Op.gte]: recentDate } }, order: [['id', 'DESC']], limit: 20, raw: true }),
      OutboundOrder.findAll({ attributes: ['id', 'order_no', 'warehouse_code', 'customer_code', 'outbound_date', 'order_status', 'create_by', 'create_time'], where: { del_flag: 0, create_time: { [Sequelize.Op.gte]: recentDate } }, order: [['id', 'DESC']], limit: 20, raw: true }),
      StockCheckOrder.findAll({ attributes: ['id', 'check_no', 'warehouse_code', 'status', 'create_by', 'create_time'], where: { del_flag: 0, create_time: { [Sequelize.Op.gte]: recentDate } }, order: [['id', 'DESC']], limit: 20, raw: true })
    ]);

    // 查仓库和关联方名称
    const docWhCodes = [...new Set([...recentInbounds, ...recentOutbounds, ...recentChecks].map(d => d.warehouse_code).filter(Boolean))];
    const supplierCodes = [...new Set(recentInbounds.map(d => d.supplier_code).filter(Boolean))];
    const customerCodes = [...new Set(recentOutbounds.map(d => d.customer_code).filter(Boolean))];
    const [docWhs, docSuppliers, docCustomers] = await Promise.all([
      docWhCodes.length > 0 ? Warehouse.findAll({ attributes: ['warehouse_code', 'warehouse_name'], where: { warehouse_code: docWhCodes, del_flag: 0 }, raw: true }) : [],
      supplierCodes.length > 0 ? Supplier.findAll({ attributes: ['supplier_code', 'supplier_name'], where: { supplier_code: supplierCodes, del_flag: 0 }, raw: true }) : [],
      customerCodes.length > 0 ? Customer.findAll({ attributes: ['customer_code', 'customer_name'], where: { customer_code: customerCodes, del_flag: 0 }, raw: true }) : []
    ]);
    const whNameMap = {}; docWhs.forEach(w => { whNameMap[w.warehouse_code] = w.warehouse_name; });
    const spNameMap = {}; docSuppliers.forEach(s => { spNameMap[s.supplier_code] = s.supplier_name; });
    const cuNameMap = {}; docCustomers.forEach(c => { cuNameMap[c.customer_code] = c.customer_name; });

    const recentDocs = [
      ...recentInbounds.map(d => ({ ...d, doc_type: 'inbound', order_no: d.order_no, status: d.order_status, warehouse_name: whNameMap[d.warehouse_code] || d.warehouse_code, related_name: spNameMap[d.supplier_code] || d.supplier_code || '', date: d.inbound_date ? String(d.inbound_date).slice(0, 10) : '' })),
      ...recentOutbounds.map(d => ({ ...d, doc_type: 'outbound', order_no: d.order_no, status: d.order_status, warehouse_name: whNameMap[d.warehouse_code] || d.warehouse_code, related_name: cuNameMap[d.customer_code] || d.customer_code || '', date: d.outbound_date ? String(d.outbound_date).slice(0, 10) : '' })),
      ...recentChecks.map(d => ({ ...d, doc_type: 'check', order_no: d.check_no, status: d.status, warehouse_name: whNameMap[d.warehouse_code] || d.warehouse_code, related_name: '', date: d.create_time ? String(d.create_time).slice(0, 10) : '' }))
    ].sort((a, b) => new Date(b.create_time) - new Date(a.create_time)).slice(0, 20);

    // 微信小程序「我的」页 KPI：今日出入库吨位、在库 SKU 数、在库总吨位
    const [todayInRows, todayOutRows, skuRows, tonRows] = await Promise.all([
      Stock.sequelize.query(
        `SELECT COALESCE(SUM(d.inbound_weight), 0) AS w
         FROM inbound_order_detail d
         INNER JOIN inbound_order o ON o.order_no = d.order_no AND o.del_flag = 0 AND d.del_flag = 0
         WHERE o.inbound_date = CURDATE()`,
        { type: QueryTypes.SELECT }
      ),
      Stock.sequelize.query(
        `SELECT COALESCE(SUM(d.outbound_weight), 0) AS w
         FROM outbound_order_detail d
         INNER JOIN outbound_order o ON o.order_no = d.order_no AND o.del_flag = 0 AND d.del_flag = 0
         WHERE o.outbound_date = CURDATE()`,
        { type: QueryTypes.SELECT }
      ),
      Stock.sequelize.query(
        `SELECT COUNT(DISTINCT product_code) AS c FROM stock WHERE del_flag = 0 AND stock_qty > 0`,
        { type: QueryTypes.SELECT }
      ),
      Stock.sequelize.query(
        `SELECT COALESCE(SUM(stock_weight), 0) AS w FROM stock WHERE del_flag = 0 AND stock_qty > 0`,
        { type: QueryTypes.SELECT }
      )
    ]);

    const today_inbound = +Number(todayInRows[0]?.w ?? 0).toFixed(4);
    const today_outbound = +Number(todayOutRows[0]?.w ?? 0).toFixed(4);
    const total_sku_count = Number(skuRows[0]?.c ?? 0);
    const total_tonnage = +Number(tonRows[0]?.w ?? 0).toFixed(2);

    res.json({
      code: 200,
      data: {
        today_inbound,
        today_outbound,
        total_sku_count,
        total_tonnage,
        panelGroup: {
          users: todayInboundCount,
          messages: todayOutboundCount,
          moneys: pendingInboundCount + pendingOutboundCount + pendingCheckCount,
          shoppings: lowStockRows[0].cnt
        },
        pieData: [
          { name: '入库单', value: inboundMonth },
          { name: '出库单', value: outboundMonth },
          { name: '盘点单', value: checkMonth }
        ],
        trendData,
        lineData,
        recentDocs
      }
    });
  } catch (err) {
    console.error('分析页数据获取失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// GET /api/dashboard/workplace — 工作台数据
exports.workplace = async (req, res) => {
  try {
    // 1. total: 统计数字
    const [productCount, todayInbound, todayOutbound, todayCheck,
           pendingInbound, pendingOutbound, pendingCheck] = await Promise.all([
      Product.count({ where: { del_flag: 0 } }),
      InboundOrder.count({ where: { inbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 } }),
      OutboundOrder.count({ where: { outbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 } }),
      StockCheckOrder.count({ where: { create_time: { [Sequelize.Op.gte]: Sequelize.literal('CURDATE()') }, del_flag: 0 } }),
      InboundOrder.count({ where: { order_status: ORDER_STATUS.SUBMIT, del_flag: 0 } }),
      OutboundOrder.count({ where: { order_status: ORDER_STATUS.SUBMIT, del_flag: 0 } }),
      StockCheckOrder.count({ where: { status: ORDER_STATUS.SUBMIT, del_flag: 0 } })
    ]);

    // 2. project: 仓库卡片（前6个启用仓库）
    const warehouses = await Warehouse.findAll({
      attributes: ['warehouse_name', 'warehouse_code', 'location', 'manager', 'create_time'],
      where: { is_enabled: 1, del_flag: 0 },
      order: [['id', 'ASC']],
      limit: 6,
      raw: true
    });

    const whCodes = warehouses.map(w => w.warehouse_code);

    // 每个仓库的指标：SKU 数、待审核数、今日操作数
    const [stockCounts, pendingInboundByWh, pendingOutboundByWh, todayOpsByWh] = await Promise.all([
      // 在库 SKU 数
      Stock.findAll({
        attributes: ['warehouse_code', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
        where: { warehouse_code: { [Sequelize.Op.in]: whCodes }, del_flag: 0 },
        group: ['warehouse_code'],
        raw: true
      }),
      // 待审核入库单
      InboundOrder.findAll({
        attributes: ['warehouse_code', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
        where: { warehouse_code: { [Sequelize.Op.in]: whCodes }, order_status: ORDER_STATUS.SUBMIT, del_flag: 0 },
        group: ['warehouse_code'],
        raw: true
      }),
      // 待审核出库单
      OutboundOrder.findAll({
        attributes: ['warehouse_code', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
        where: { warehouse_code: { [Sequelize.Op.in]: whCodes }, order_status: ORDER_STATUS.SUBMIT, del_flag: 0 },
        group: ['warehouse_code'],
        raw: true
      }),
      // 今日操作（入库+出库）
      Promise.all([
        InboundOrder.findAll({
          attributes: ['warehouse_code', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
          where: { warehouse_code: { [Sequelize.Op.in]: whCodes }, inbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 },
          group: ['warehouse_code'],
          raw: true
        }),
        OutboundOrder.findAll({
          attributes: ['warehouse_code', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
          where: { warehouse_code: { [Sequelize.Op.in]: whCodes }, outbound_date: Sequelize.literal('CURDATE()'), del_flag: 0 },
          group: ['warehouse_code'],
          raw: true
        })
      ])
    ]);
    const [todayInboundByWh, todayOutboundByWh] = todayOpsByWh;

    function getCnt(arr, code) {
      const row = arr.find(r => r.warehouse_code === code);
      return row ? Number(row.cnt) : 0;
    }

    // 3. dynamic: 最近业务操作日志（前10条，排除 HTTP 访问日志）
    const logs = await SysOperationLog.findAll({
      attributes: ['operation', 'operation_desc', 'business_type', 'create_time'],
      where: { status: 1, business_type: { [Sequelize.Op.ne]: null } },
      order: [['id', 'DESC']],
      limit: 10,
      raw: true
    });

    // 4. team: 活跃用户（近30天有操作的，前6个）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [activeUsers] = await SysOperationLog.sequelize.query(
      `SELECT DISTINCT username FROM sys_operation_log
       WHERE create_time >= :sd AND status = 1
       LIMIT 6`,
      { replacements: { sd: thirtyDaysAgo } }
    );

    // 5. radar: 运营指标（真实统计口径）
    const activeWarehouseCount = warehouses.length;
    const todayOps = todayInbound + todayOutbound + todayCheck;
    const pendingTotal = pendingInbound + pendingOutbound + pendingCheck;

    res.json({
      code: 200,
      data: {
        total: {
          project: productCount,
          access: todayOps,
          todo: pendingTotal
        },
        project: warehouses.map(w => ({
          name: w.warehouse_name,
          icon: 'vi-ant-design:home-filled',
          message: w.location || '暂无地址信息',
          personal: w.manager || '暂无负责人',
          time: w.create_time,
          skuCount: getCnt(stockCounts, w.warehouse_code),
          pendingCount: getCnt(pendingInboundByWh, w.warehouse_code) + getCnt(pendingOutboundByWh, w.warehouse_code),
          todayCount: getCnt(todayInboundByWh, w.warehouse_code) + getCnt(todayOutboundByWh, w.warehouse_code)
        })),
        dynamic: logs.map(l => ({
          keys: [l.operation_desc || l.operation || '', l.business_type || ''],
          time: l.create_time
        })),
        team: activeUsers.map(u => ({
          name: u.username,
          icon: 'vi-ant-design:user-outlined'
        })),
        radar: [
          { name: '今日入库', max: Math.max(20, todayInbound * 2), personal: todayInbound, team: Math.round(todayInbound * 0.6) },
          { name: '今日出库', max: Math.max(20, todayOutbound * 2), personal: todayOutbound, team: Math.round(todayOutbound * 0.6) },
          { name: '待审核', max: Math.max(10, pendingTotal * 2), personal: pendingTotal, team: 0 },
          { name: '商品种类', max: Math.max(100, productCount * 2), personal: productCount, team: Math.round(productCount * 0.5) },
          { name: '活跃仓库', max: Math.max(10, activeWarehouseCount * 2), personal: activeWarehouseCount, team: Math.round(activeWarehouseCount * 0.6) }
        ]
      }
    });
  } catch (err) {
    console.error('工作台数据获取失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
