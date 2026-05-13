const SysMessage = require('../models/sys_message');
const SysUser = require('../models/sys_user');
const SysRole = require('../models/sys_role');
const SysUserRole = require('../models/sys_user_role');
const { Op } = require('sequelize');

async function findAuditorUserIds() {
  const roles = await SysRole.findAll({ where: { role_code: { [Op.in]: ['ADMIN', 'AUDITOR'] }, del_flag: 0 }, raw: true });
  if (roles.length === 0) return [];
  const roleIds = roles.map(r => r.id);
  const mappings = await SysUserRole.findAll({ where: { role_id: { [Op.in]: roleIds } }, raw: true });
  return [...new Set(mappings.map(m => m.user_id))];
}

async function findUserIdByUsername(username) {
  if (!username) return null;
  const user = await SysUser.findOne({ where: { username, del_flag: 0 }, raw: true });
  return user ? user.id : null;
}

async function hasActiveAlert(stock, alertType) {
  const businessId = `${stock.warehouse_code}_${stock.product_code}_${alertType}`;
  const lastAlert = await SysMessage.findOne({
    where: { business_type: 'stock', business_id: businessId, type: alertType, del_flag: 0 },
    order: [['create_time', 'DESC']],
    raw: true
  });
  if (!lastAlert) return false;

  // Check if a resolve message was created after the last alert
  const lastResolve = await SysMessage.findOne({
    where: {
      business_type: 'stock',
      type: 'alert_normal',
      business_id: businessId,
      del_flag: 0
    },
    order: [['create_time', 'DESC']],
    raw: true
  });

  if (!lastResolve) return true; // no resolve message at all
  return new Date(lastResolve.create_time) < new Date(lastAlert.create_time);
}

module.exports = {
  hasActiveAlert,

  async createStockAlert(stock, alertType) {
    try {
      const typeStr = alertType === 'low' ? 'alert_low' : 'alert_high';
      if (await hasActiveAlert(stock, typeStr)) return null;

      const isLow = alertType === 'low';
      const threshold = isLow ? Number(stock.min_alert_weight) : Number(stock.max_alert_weight);
      const current = Number(stock.stock_weight) || 0;
      const title = isLow ? '库存低于预警下限' : '库存高于预警上限';
      const content = `商品「${stock.product_code} ${stock.product_name}」在仓库「${stock.warehouse_name || stock.warehouse_code}」当前库存吨位 ${current.toFixed(3)}，${isLow ? '低于' : '高于'}预警${isLow ? '下限' : '上限'} ${threshold.toFixed(3)} 吨。请及时处理。`;

      return SysMessage.create({
        title, content, type: typeStr, business_type: 'stock',
        business_id: `${stock.warehouse_code}_${stock.product_code}_${typeStr}`,
        receiver_id: null
      });
    } catch (err) {
      console.error('[notification] createStockAlert:', err.message || err);
      return null;
    }
  },

  async resolveStockAlert(stock) {
    try {
      const w = Number(stock.stock_weight) || 0;
      const min = Number(stock.min_alert_weight);
      const max = Number(stock.max_alert_weight);

      for (const alertType of ['alert_low', 'alert_high']) {
        const stillActive = alertType === 'alert_low' ? (min && w < min) : (max && w > max);
        if (stillActive) continue;
        if (!(await hasActiveAlert(stock, alertType))) continue;

        const label = alertType === 'alert_low' ? '下限' : '上限';
        const content = `商品「${stock.product_code} ${stock.product_name}」在仓库「${stock.warehouse_name || stock.warehouse_code}」当前库存吨位 ${w.toFixed(3)}，预警${label}已恢复正常。`;

        await SysMessage.create({
          title: `库存预警${label}已恢复`,
          content,
          type: 'alert_normal',
          business_type: 'stock',
          business_id: `${stock.warehouse_code}_${stock.product_code}_${alertType}`,
          receiver_id: null
        });
      }
    } catch (err) {
      console.error('[notification] resolveStockAlert:', err.message || err);
    }
  },

  async createSubmitNotification(order, orderType) {
    try {
      const typeLabel = orderType === 'inbound' ? '入库单' : '出库单';
      const auditorIds = await findAuditorUserIds();
      if (auditorIds.length === 0) return;

      await SysMessage.bulkCreate(auditorIds.map(receiver_id => ({
        title: `待审核${typeLabel}`,
        content: `${typeLabel}「${order.order_no}」已提交审核，请及时处理。`,
        type: 'order_submit',
        business_type: orderType,
        business_id: order.order_no,
        receiver_id
      })));
    } catch (err) {
      console.error('[notification] createSubmitNotification:', err.message || err);
    }
  },

  async createAuditNotification(order, orderType) {
    try {
      const typeLabel = orderType === 'inbound' ? '入库单' : '出库单';
      const creatorId = await findUserIdByUsername(order.create_by);
      if (!creatorId) return;

      await SysMessage.create({
        title: `${typeLabel}审核通过`,
        content: `${typeLabel}「${order.order_no}」已审核通过。`,
        type: 'order_audit',
        business_type: orderType,
        business_id: order.order_no,
        receiver_id: creatorId
      });
    } catch (err) {
      console.error('[notification] createAuditNotification:', err.message || err);
    }
  }
};
