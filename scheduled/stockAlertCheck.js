const Stock = require('../models/stock');
const notificationService = require('../services/notificationService');

async function checkAllStocks() {
  console.log('[定时任务] 开始检查库存预警...');
  try {
    const stocks = await Stock.findAll({ where: { del_flag: 0 }, raw: true });
    let alertCount = 0;

    for (const stock of stocks) {
      const w = Number(stock.stock_weight) || 0;
      const min = Number(stock.min_alert_weight);
      const max = Number(stock.max_alert_weight);

      if (min && w < min) {
        const msg = await notificationService.createStockAlert(stock, 'low');
        if (msg) alertCount++;
      }
      if (max && w > max) {
        const msg = await notificationService.createStockAlert(stock, 'high');
        if (msg) alertCount++;
      }
      // Resolve alerts that are no longer active (handles both types internally)
      await notificationService.resolveStockAlert(stock);
    }

    console.log(`[定时任务] 库存预警检查完成 - 新增预警: ${alertCount} 条`);
  } catch (err) {
    console.error('[定时任务] 库存预警检查失败:', err);
  }
}

module.exports = { checkAllStocks };
