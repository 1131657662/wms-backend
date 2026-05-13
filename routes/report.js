const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.get('/monthly-summary', auth, asyncHandler(ctrl.monthlySummary));
router.get('/turnover', auth, asyncHandler(ctrl.turnover));
router.get('/monthly-summary/export', auth, asyncHandler(ctrl.exportMonthlySummary));
router.get('/turnover/export', auth, asyncHandler(ctrl.exportTurnover));
router.get('/inbound-detail', auth, asyncHandler(ctrl.inboundDetail));
router.get('/inbound-detail/export', auth, asyncHandler(ctrl.exportInboundDetail));
router.get('/outbound-detail', auth, asyncHandler(ctrl.outboundDetail));
router.get('/outbound-detail/export', auth, asyncHandler(ctrl.exportOutboundDetail));
router.get('/stock-journal', auth, asyncHandler(ctrl.stockJournal));
router.get('/stock-journal/export', auth, asyncHandler(ctrl.exportStockJournal));
router.get('/period-summary', auth, asyncHandler(ctrl.periodSummary));
router.get('/period-summary/export', auth, asyncHandler(ctrl.exportPeriodSummary));
router.get('/stock-aging', auth, asyncHandler(ctrl.stockAging));
router.get('/stock-aging/export', auth, asyncHandler(ctrl.exportStockAging));

module.exports = router;
