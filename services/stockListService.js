'use strict';

const Stock = require('../models/stock');
const { Op } = require('sequelize');
const { clampPage, clampPageSize } = require('../utils/pagination');

/**
 * 构建库存列表查询条件（与历史 stock.js list 行为一致）
 * @param {Record<string, string | undefined>} query
 */
function buildListWhere(query) {
  const { keyword, warehouse_code, product_code, product_name, product_model, alert } = query;
  const where = { del_flag: 0 };

  if (keyword) {
    where[Op.or] = [
      { product_code: { [Op.like]: `%${keyword}%` } },
      { product_name: { [Op.like]: `%${keyword}%` } },
      { product_model: { [Op.like]: `%${keyword}%` } },
      { warehouse_name: { [Op.like]: `%${keyword}%` } }
    ];
  }
  if (warehouse_code) where.warehouse_code = warehouse_code;
  if (product_code) where.product_code = product_code;
  if (product_name) where.product_name = { [Op.like]: `%${product_name}%` };
  if (product_model) where.product_model = { [Op.like]: `%${product_model}%` };
  if (alert === 'zero') {
    where.stock_qty = 0;
  } else if (alert === 'low') {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(
      { stock_qty: { [Op.gt]: 0 } },
      { min_alert_weight: { [Op.ne]: null } },
      { stock_weight: { [Op.lt]: Stock.sequelize.col('min_alert_weight') } }
    );
  } else if (alert === 'high') {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(
      { stock_qty: { [Op.gt]: 0 } },
      { max_alert_weight: { [Op.ne]: null } },
      { stock_weight: { [Op.gt]: Stock.sequelize.col('max_alert_weight') } }
    );
  } else if (alert === 'normal') {
    where.stock_qty = { [Op.gt]: 0 };
    where[Op.or] = [
      { min_alert_weight: null, max_alert_weight: null },
      {
        stock_weight: {
          [Op.and]: [
            { [Op.gte]: Stock.sequelize.col('min_alert_weight') },
            { [Op.lte]: Stock.sequelize.col('max_alert_weight') }
          ]
        }
      }
    ];
  } else {
    where.stock_qty = { [Op.gt]: 0 };
  }

  return where;
}

async function findListPage(query) {
  const page = clampPage(query.page);
  const pageSize = clampPageSize(query.pageSize, 10);
  const where = buildListWhere(query);
  return Stock.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: Number(pageSize)
  });
}

module.exports = { buildListWhere, findListPage };
