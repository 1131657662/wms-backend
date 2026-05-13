'use strict';

const InboundOrder = require('../models/inbound_order');
const InboundOrderDetail = require('../models/inbound_order_detail');
const Supplier = require('../models/supplier');
const Warehouse = require('../models/warehouse');
const { Op, fn, col } = require('sequelize');
const { clampPage, clampPageSize, BULK_LIST_MAX } = require('../utils/pagination');

/**
 * 入库单列表（主表筛选 + 明细合计 + 供应商/仓库名称）
 * @param {Record<string, string|undefined>} query
 */
async function listPage(query) {
  const { page: rqPage, pageSize: rqPs, ...filters } = query;
  const page = clampPage(rqPage);
  const pageSize = clampPageSize(rqPs, 10, BULK_LIST_MAX);
  const where = { del_flag: 0 };

  if (filters.order_no) where.order_no = { [Op.like]: `%${filters.order_no}%` };
  if (filters.inbound_date_start && filters.inbound_date_end) {
    where.inbound_date = { [Op.between]: [filters.inbound_date_start, filters.inbound_date_end] };
  } else if (filters.inbound_date_start) {
    where.inbound_date = { [Op.gte]: filters.inbound_date_start };
  } else if (filters.inbound_date_end) {
    where.inbound_date = { [Op.lte]: filters.inbound_date_end };
  }
  if (filters.vehicle_no) where.vehicle_no = { [Op.like]: `%${filters.vehicle_no}%` };
  if (filters.container_no) where.container_no = { [Op.like]: `%${filters.container_no}%` };
  if (filters.warehouse_code) where.warehouse_code = filters.warehouse_code;
  if (filters.bill_type_code) where.bill_type_code = filters.bill_type_code;
  if (filters.supplier_code) where.supplier_code = { [Op.like]: `%${filters.supplier_code}%` };
  if (filters.delivery_no) where.delivery_no = { [Op.like]: `%${filters.delivery_no}%` };
  if (filters.order_status) where.order_status = filters.order_status;
  if (filters.audit_by) where.audit_by = { [Op.like]: `%${filters.audit_by}%` };
  if (filters.create_by) where.create_by = { [Op.like]: `%${filters.create_by}%` };

  const { count, rows } = await InboundOrder.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: Number(pageSize)
  });

  const orderNos = rows.map(r => r.order_no).filter(Boolean);
  let detailAggMap = {};
  if (orderNos.length > 0) {
    const details = await InboundOrderDetail.findAll({
      attributes: [
        'order_no',
        [fn('COALESCE', fn('SUM', col('inbound_qty')), 0), 'totalQty'],
        [fn('COALESCE', fn('SUM', col('inbound_weight')), 0), 'totalWeight']
      ],
      where: { order_no: { [Op.in]: orderNos }, del_flag: 0 },
      group: ['order_no'],
      raw: true
    });
    details.forEach(d => {
      detailAggMap[d.order_no] = { totalQty: Number(d.totalQty), totalWeight: Number(d.totalWeight) };
    });
  }

  const supplierCodes = [...new Set(rows.map(r => r.supplier_code).filter(Boolean))];
  const warehouseCodes = [...new Set(rows.map(r => r.warehouse_code).filter(Boolean))];
  const [supplierMap, warehouseMap] = await Promise.all([
    (async () => {
      const map = {};
      if (supplierCodes.length > 0) {
        const suppliers = await Supplier.findAll({
          attributes: ['supplier_code', 'supplier_name'],
          where: { supplier_code: { [Op.in]: supplierCodes }, del_flag: 0 },
          raw: true
        });
        suppliers.forEach(s => {
          map[s.supplier_code] = s.supplier_name;
        });
      }
      return map;
    })(),
    (async () => {
      const map = {};
      if (warehouseCodes.length > 0) {
        const warehouses = await Warehouse.findAll({
          attributes: ['warehouse_code', 'warehouse_name'],
          where: { warehouse_code: { [Op.in]: warehouseCodes }, del_flag: 0 },
          raw: true
        });
        warehouses.forEach(w => {
          map[w.warehouse_code] = w.warehouse_name;
        });
      }
      return map;
    })()
  ]);

  const list = rows.map(r => {
    const agg = detailAggMap[r.order_no] || { totalQty: 0, totalWeight: 0 };
    return {
      ...r.toJSON(),
      totalQty: agg.totalQty,
      totalWeight: agg.totalWeight,
      supplier_name: supplierMap[r.supplier_code] || '',
      warehouse_name: warehouseMap[r.warehouse_code] || ''
    };
  });

  return { list, total: count, page, pageSize };
}

module.exports = { listPage };
