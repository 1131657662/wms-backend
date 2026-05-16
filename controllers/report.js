const { sendSuccess, sendError } = require('../utils/apiResponse');
const { rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { monthlySummaryList, writeMonthlyWorkbookToStream } = require('../services/reportMonthlySummaryService');
const { turnoverList, writeTurnoverWorkbookToStream } = require('../services/reportTurnoverService');
const { inboundDetailList, writeInboundDetailWorkbookToStream } = require('../services/reportInboundDetailService');
const { outboundDetailList, writeOutboundDetailWorkbookToStream } = require('../services/reportOutboundDetailService');
const { stockJournalList, writeStockJournalWorkbookToStream } = require('../services/reportStockJournalService');
const { periodSummaryList, writePeriodSummaryWorkbookToStream } = require('../services/reportPeriodSummaryService');
const { stockAgingList, writeStockAgingWorkbookToStream } = require('../services/reportStockAgingService');
const {
  inventorySettlementList,
  writeInventorySettlementWorkbookToStream
} = require('../services/reportInventorySettlementService');

// 月度出入库汇总报表
exports.monthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();
    const list = await monthlySummaryList(y);
    return sendSuccess(res, { list, total: list.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('月度汇总报表失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// 商品周转率统计
exports.turnover = async (req, res) => {
  try {
    const list = await turnoverList(req.query);
    return sendSuccess(res, { list, total: list.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('商品周转率报表失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// 月度汇总导出 Excel
exports.exportMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(y + '年月度出入库汇总.xlsx')}`);
    await writeMonthlyWorkbookToStream(res, y);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出月度汇总失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// 周转率导出 Excel
exports.exportTurnover = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('商品周转率统计.xlsx')}`);
    await writeTurnoverWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出周转率失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// ==================== 入库明细报表 ====================

exports.inboundDetail = async (req, res) => {
  try {
    const payload = await inboundDetailList(req.query);
    return sendSuccess(res, payload);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('入库明细报表失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportInboundDetail = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('入库明细报表.xlsx')}`);
    await writeInboundDetailWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出入库明细失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// ==================== 出库明细报表 ====================

exports.outboundDetail = async (req, res) => {
  try {
    const payload = await outboundDetailList(req.query);
    return sendSuccess(res, payload);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('出库明细报表失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportOutboundDetail = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('出库明细报表.xlsx')}`);
    await writeOutboundDetailWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出出库明细失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// ==================== 进销存台账 ====================

exports.stockJournal = async (req, res) => {
  try {
    const payload = await stockJournalList(req.query);
    return sendSuccess(res, payload);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('进销存台账失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportStockJournal = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('进销存台账.xlsx')}`);
    await writeStockJournalWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出进销存台账失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// ==================== 收发存汇总表 ====================

exports.periodSummary = async (req, res) => {
  try {
    const payload = await periodSummaryList(req.query);
    return sendSuccess(res, payload);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('收发存汇总报表失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportPeriodSummary = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('收发存汇总表.xlsx')}`);
    await writePeriodSummaryWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出收发存汇总失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// ==================== 库龄分析报表 ====================

exports.stockAging = async (req, res) => {
  try {
    const payload = await stockAgingList(req.query);
    return sendSuccess(res, payload);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库龄分析报表失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportStockAging = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('库龄分析报表.xlsx')}`);
    await writeStockAgingWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出库龄分析失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

// ==================== 库存结算对账单 ====================

exports.inventorySettlement = async (req, res) => {
  try {
    const payload = await inventorySettlementList(req.query);
    return sendSuccess(res, payload);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('库存结算对账单失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportInventorySettlement = async (req, res) => {
  try {
    const { month } = req.query;
    const label = month ? String(month) : '对账单';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(`库存结算对账单_${label}.xlsx`)}`
    );
    await writeInventorySettlementWorkbookToStream(res, req.query);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('导出库存结算对账单失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};
