const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report');
const auth = require('../middleware/auth');

router.get('/monthly-summary', auth, ctrl.monthlySummary);
router.get('/turnover', auth, ctrl.turnover);
router.get('/monthly-summary/export', auth, ctrl.exportMonthlySummary);
router.get('/turnover/export', auth, ctrl.exportTurnover);
router.get('/inbound-detail', auth, ctrl.inboundDetail);
router.get('/inbound-detail/export', auth, ctrl.exportInboundDetail);
router.get('/outbound-detail', auth, ctrl.outboundDetail);
router.get('/outbound-detail/export', auth, ctrl.exportOutboundDetail);
router.get('/stock-journal', auth, ctrl.stockJournal);
router.get('/stock-journal/export', auth, ctrl.exportStockJournal);
router.get('/period-summary', auth, ctrl.periodSummary);
router.get('/period-summary/export', auth, ctrl.exportPeriodSummary);
router.get('/stock-aging', auth, ctrl.stockAging);
router.get('/stock-aging/export', auth, ctrl.exportStockAging);

module.exports = router;
