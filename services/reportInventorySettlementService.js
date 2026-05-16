'use strict';

const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const Warehouse = require('../models/warehouse');
const { ORDER_STATUS } = require('../config/constants');

const ORDER_IN = `'${ORDER_STATUS.AUDITED}','${ORDER_STATUS.COMPLETED}'`;

const PRODUCT_COL_COUNT = 3;

function parseMonth(monthStr) {
  const m = String(monthStr || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(m);
  if (!match) {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      startDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: '',
      monthLabel: ''
    };
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return {
    year,
    month,
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    monthLabel: `${year}-${mm}`
  };
}

function parseProductCodes(q) {
  const raw = q?.product_codes;
  if (raw == null || raw === '') return [];
  const parts = Array.isArray(raw) ? raw : String(raw).split(/[,，]/);
  return [...new Set(parts.map(v => String(v ?? '').trim()).filter(Boolean))];
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatDateLabel(isoDate) {
  if (!isoDate) return '';
  const s = String(isoDate).slice(0, 10);
  const [, m, d] = s.split('-');
  return `${Number(m)}月${Number(d)}日`;
}

function parseIsoDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatIsoLocal(d) {
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/** 含首尾的自然日天数 */
function daysInclusive(startIso, endIso) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null;
  }
  return Math.floor((end - start) / 86400000) + 1;
}

function excelDateFromIso(iso) {
  if (!iso) return null;
  return parseIsoDate(iso);
}

/** 当月日号（1–31），对账单按月内日号差计算 */
function dayOfMonthFromIso(iso) {
  return Number(String(iso).slice(8, 10));
}

/** 当月总自然日数（如 4 月 = 30） */
function monthDayCount(endDate) {
  return dayOfMonthFromIso(endDate);
}

function isHoldingRow(row) {
  return row.row_type === 'opening' || row.row_type === 'inbound';
}

function findNextLaterDay(rows, fromIdx, curDay) {
  for (let j = fromIdx + 1; j < rows.length; j += 1) {
    const d = dayOfMonthFromIso(rows[j].biz_date);
    if (d > curDay) return d;
  }
  return null;
}

function isZeroBalance(row) {
  return num(row.balance_qty) === 0 && num(row.balance_weight) === 0;
}

/**
 * 存储天数：按「已计费到 coveredThrough 日」递推，避免 1–7 与 7–16 重复计天。
 * - 期初(1日)：计到下一笔更晚日期行（含该日），如计到 7 日 → 7 天
 * - 进仓：若日号 ≤ coveredThrough，从下一天段续算到下一更晚日（如 7→16 为 9 天）；日号已覆盖则本行不填
 * - 首行仅为进仓：下一更晚日 − 当前日 + 1（含进仓日）
 * - 出仓出清库存：不填；末行出仓：月末日号 − 当日；后有流水：下一行日号 − 当日
 */
function applyStorageDays(rows, _startDate, endDate) {
  const monthDays = monthDayCount(endDate);
  let coveredThrough = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const cur = dayOfMonthFromIso(row.biz_date);
    row.storage_days = null;

    if (isHoldingRow(row)) {
      const nextLaterDay = findNextLaterDay(rows, i, cur);

      if (coveredThrough === 0) {
        if (row.row_type === 'opening') {
          if (nextLaterDay != null) {
            row.storage_days = nextLaterDay - coveredThrough;
            coveredThrough = nextLaterDay;
          } else {
            row.storage_days = monthDays;
            coveredThrough = monthDays;
          }
        } else if (nextLaterDay != null) {
          row.storage_days = nextLaterDay - cur + 1;
          coveredThrough = nextLaterDay;
        } else {
          row.storage_days = monthDays - cur + 1;
          coveredThrough = monthDays;
        }
      } else if (cur <= coveredThrough) {
        if (nextLaterDay != null) {
          row.storage_days = nextLaterDay - coveredThrough;
          coveredThrough = nextLaterDay;
        }
      } else if (nextLaterDay != null) {
        row.storage_days = nextLaterDay - cur + 1;
        coveredThrough = nextLaterDay;
      } else {
        row.storage_days = monthDays - cur + 1;
        coveredThrough = monthDays;
      }
      continue;
    }

    if (row.row_type === 'outbound') {
      if (isZeroBalance(row)) continue;
      const next = i + 1 < rows.length ? rows[i + 1] : null;
      if (!next) {
        row.storage_days = monthDays - cur;
      } else if (dayOfMonthFromIso(next.biz_date) > cur) {
        row.storage_days = dayOfMonthFromIso(next.biz_date) - cur;
      }
    }
  }

  return rows;
}

/** 月初期初行合并同日进仓（与 Excel 一致：上月库存与同日入库同一行） */
function mergeOpeningWithSameDayInbound(rows, startDate) {
  if (!rows.length || rows[0].row_type !== 'opening') return rows;
  const opening = { ...rows[0] };
  let i = 1;
  while (
    i < rows.length &&
    rows[i].row_type === 'inbound' &&
    rows[i].biz_date === startDate
  ) {
    const inRow = rows[i];
    opening.in_qty = num(opening.in_qty) + num(inRow.in_qty);
    opening.in_weight = num(opening.in_weight) + num(inRow.in_weight);
    opening.balance_qty = num(inRow.balance_qty);
    opening.balance_weight = num(inRow.balance_weight);
    opening.row_type_label = '期初/进仓';
    i += 1;
  }
  return [opening, ...rows.slice(i)];
}

function finalizeProductRows(productRows, startDate, endDate) {
  const merged = mergeOpeningWithSameDayInbound(productRows, startDate);
  return applyStorageDays(merged, startDate, endDate);
}

function formatProductDesc(code, name, model) {
  return [code, name, model]
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
    .join('-');
}

function productGroupKey(code, name, model) {
  const c = String(code ?? '').trim();
  if (c) return c;
  const n = String(name ?? '').trim();
  const m = String(model ?? '').trim();
  return n || m ? `${n}|${m}` : '';
}

function productMetaFromRow(r) {
  const product_code = r.product_code || '';
  const product_name = r.product_name || '';
  const product_model = r.product_model || '';
  return {
    product_code,
    product_name,
    product_model,
    product_desc: formatProductDesc(product_code, product_name, product_model)
  };
}

function productOptionLabel(meta) {
  const parts = [meta.product_code, meta.product_name, meta.product_model]
    .map(v => String(v ?? '').trim())
    .filter(Boolean);
  return parts.join(' · ') || meta.product_desc || meta.group_key;
}

async function fetchActiveWarehouses() {
  return Warehouse.findAll({
    attributes: ['warehouse_code', 'warehouse_name'],
    where: { del_flag: 0 },
    order: [['warehouse_code', 'ASC']],
    raw: true
  });
}

function openingMetaFromJournalRow(r, source) {
  return {
    ...productMetaFromRow(r),
    qty: num(r.after_qty),
    weight: num(r.after_weight),
    source
  };
}

/**
 * 上月结存（期初行）：
 * - 期初库存 import 仅在「导入所在当月」视同上月结存（只导入一次，次月起用真实月末流水）
 * - 其它月份：月初前最后一条流水日终（入/出/调整等，不含历史 import 重复套用）
 */
async function fetchOpeningBalances(startDate, endDate, warehouse_code) {
  const beforeTs = `${startDate} 00:00:00`;
  const monthEndTs = `${endDate} 23:59:59`;
  const map = new Map();
  const snapshotMap = new Map();
  const importInMonthMap = new Map();

  const [rowsSnapshot] = await sequelize.query(
    `
    SELECT sj.product_name, sj.product_code, sj.product_model, sj.after_qty, sj.after_weight
    FROM stock_journal sj
    INNER JOIN (
      SELECT product_code, MAX(id) AS max_id
      FROM stock_journal
      WHERE del_flag = 0 AND create_time < ? AND warehouse_code = ?
      GROUP BY product_code
    ) t ON sj.id = t.max_id
  `,
    { replacements: [beforeTs, warehouse_code] }
  );
  rowsSnapshot.forEach(r => {
    const key = productGroupKey(r.product_code, r.product_name, r.product_model);
    if (key) snapshotMap.set(key, openingMetaFromJournalRow(r, 'snapshot'));
  });

  const [rowsImportInMonth] = await sequelize.query(
    `
    SELECT sj.product_name, sj.product_code, sj.product_model, sj.after_qty, sj.after_weight
    FROM stock_journal sj
    INNER JOIN (
      SELECT product_code, MAX(id) AS max_id
      FROM stock_journal
      WHERE del_flag = 0 AND warehouse_code = ? AND business_type = 'import'
        AND create_time >= ? AND create_time <= ?
      GROUP BY product_code
    ) t ON sj.id = t.max_id
  `,
    { replacements: [warehouse_code, beforeTs, monthEndTs] }
  );
  rowsImportInMonth.forEach(r => {
    const key = productGroupKey(r.product_code, r.product_name, r.product_model);
    if (key) importInMonthMap.set(key, openingMetaFromJournalRow(r, 'import_in_month'));
  });

  const keys = new Set([...snapshotMap.keys(), ...importInMonthMap.keys()]);
  keys.forEach(key => {
    const meta = importInMonthMap.get(key) || snapshotMap.get(key);
    if (meta) map.set(key, meta);
  });

  return map;
}

async function fetchMonthJournals(startDate, endDate, warehouse_code) {
  const sql = `
    SELECT sj.id, sj.product_code, sj.product_name, sj.product_model, sj.business_type,
      sj.change_qty, sj.change_weight, sj.after_qty, sj.after_weight, sj.order_no,
      CASE
        WHEN sj.business_type = 'inbound' THEN DATE(io.inbound_date)
        WHEN sj.business_type = 'outbound' THEN DATE(oo.outbound_date)
        ELSE DATE(sj.create_time)
      END AS biz_date
    FROM stock_journal sj
    LEFT JOIN inbound_order io ON sj.order_no = io.order_no AND io.del_flag = 0
      AND io.order_status IN (${ORDER_IN})
    LEFT JOIN outbound_order oo ON sj.order_no = oo.order_no AND oo.del_flag = 0
      AND oo.order_status IN (${ORDER_IN})
    WHERE sj.del_flag = 0
      AND sj.warehouse_code = ?
      AND sj.business_type IN ('inbound', 'outbound')
      AND (
        (sj.business_type = 'inbound' AND io.inbound_date >= ? AND io.inbound_date <= ?)
        OR (sj.business_type = 'outbound' AND oo.outbound_date >= ? AND oo.outbound_date <= ?)
      )
    ORDER BY sj.product_code ASC, biz_date ASC, sj.business_type ASC, sj.id ASC
  `;
  const reps = [warehouse_code, startDate, endDate, startDate, endDate];
  const [rows] = await sequelize.query(sql, { replacements: reps });
  return rows;
}

function buildOpeningRow(meta, startDate, groupKey) {
  const qty = meta.qty;
  const weight = meta.weight;
  return {
    group_key: groupKey,
    product_code: meta.product_code,
    product_name: meta.product_name,
    product_model: meta.product_model,
    product_desc: meta.product_desc,
    biz_date: startDate,
    biz_date_label: formatDateLabel(startDate),
    row_type: 'opening',
    row_type_label: '期初',
    open_qty: qty,
    open_weight: weight,
    in_qty: 0,
    in_weight: 0,
    out_qty: 0,
    out_weight: 0,
    balance_qty: qty,
    balance_weight: weight,
    storage_days: null
  };
}

function buildInboundRow(r, groupKey) {
  const bizDate = String(r.biz_date).slice(0, 10);
  const meta = productMetaFromRow(r);
  return {
    group_key: groupKey,
    ...meta,
    biz_date: bizDate,
    biz_date_label: formatDateLabel(bizDate),
    row_type: 'inbound',
    row_type_label: '进仓',
    open_qty: 0,
    open_weight: 0,
    in_qty: Math.abs(num(r.change_qty)),
    in_weight: Math.abs(num(r.change_weight)),
    out_qty: 0,
    out_weight: 0,
    balance_qty: num(r.after_qty),
    balance_weight: num(r.after_weight),
    storage_days: null,
    order_no: r.order_no
  };
}

function buildOutboundRow(r, groupKey) {
  const bizDate = String(r.biz_date).slice(0, 10);
  const meta = productMetaFromRow(r);
  return {
    group_key: groupKey,
    ...meta,
    biz_date: bizDate,
    biz_date_label: formatDateLabel(bizDate),
    row_type: 'outbound',
    row_type_label: '出仓',
    open_qty: 0,
    open_weight: 0,
    in_qty: 0,
    in_weight: 0,
    out_qty: Math.abs(num(r.change_qty)),
    out_weight: Math.abs(num(r.change_weight)),
    balance_qty: num(r.after_qty),
    balance_weight: num(r.after_weight),
    storage_days: null,
    order_no: r.order_no
  };
}

/** 为连续同 group_key 的行标注合并行数（Excel / 表格 span-method） */
function buildGroupSubtotal(productRows, lastRow) {
  return {
    in_qty: productRows.reduce((s, x) => s + num(x.in_qty), 0),
    in_weight: productRows.reduce((s, x) => s + num(x.in_weight), 0),
    out_qty: productRows.reduce((s, x) => s + num(x.out_qty), 0),
    out_weight: productRows.reduce((s, x) => s + num(x.out_weight), 0),
    balance_qty: num(lastRow?.balance_qty),
    balance_weight: num(lastRow?.balance_weight)
  };
}

function annotateGroupSpans(list) {
  let i = 0;
  while (i < list.length) {
    const key = list[i].group_key;
    let j = i + 1;
    while (j < list.length && list[j].group_key === key) j += 1;
    const span = j - i;
    for (let k = i; k < j; k += 1) {
      list[k].group_rowspan = k === i ? span : 0;
    }
    i = j;
  }
  return list;
}

async function buildWarehouseSettlement(startDate, endDate, warehouse_code) {
  const openingMap = await fetchOpeningBalances(startDate, endDate, warehouse_code);
  const journals = await fetchMonthJournals(startDate, endDate, warehouse_code);

  const byProduct = new Map();
  journals.forEach(r => {
    const key = productGroupKey(r.product_code, r.product_name, r.product_model);
    if (!key) return;
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key).push(r);
  });

  const productKeys = new Set([...openingMap.keys(), ...byProduct.keys()]);
  const sortedKeys = [...productKeys].sort((a, b) =>
    String(a).localeCompare(String(b), 'zh-CN')
  );

  const list = [];
  const groups = [];

  sortedKeys.forEach(groupKey => {
    const opening = openingMap.get(groupKey);
    const hasOpening = opening && (opening.qty > 0 || opening.weight > 0);
    const txs = byProduct.get(groupKey) || [];
    const productRows = [];

    if (hasOpening) {
      productRows.push(buildOpeningRow(opening, startDate, groupKey));
    }

    const sortedTxs = txs.slice().sort((a, b) => {
      const da = String(a.biz_date).slice(0, 10);
      const db = String(b.biz_date).slice(0, 10);
      if (da !== db) return da.localeCompare(db);
      const order = { inbound: 1, outbound: 2 };
      return (order[a.business_type] || 9) - (order[b.business_type] || 9);
    });
    sortedTxs.forEach(r => {
      productRows.push(
        r.business_type === 'inbound'
          ? buildInboundRow(r, groupKey)
          : buildOutboundRow(r, groupKey)
      );
    });

    if (productRows.length === 0) return;

    const finalizedRows = finalizeProductRows(productRows, startDate, endDate);

    const head = finalizedRows[0];
    const last = finalizedRows[finalizedRows.length - 1];
    groups.push({
      group_key: groupKey,
      product_code: head.product_code,
      product_name: head.product_name,
      product_model: head.product_model,
      product_desc: head.product_desc,
      rows: finalizedRows,
      subtotal: buildGroupSubtotal(finalizedRows, last)
    });
    list.push(...finalizedRows);
  });

  annotateGroupSpans(list);
  return enrichWarehousePayload({ list, groups, total: list.length });
}

function matchesProductFilter(groupKey, productCode, filterCodes) {
  if (!filterCodes.length) return true;
  const code = String(productCode ?? '').trim();
  return filterCodes.some(c => c === groupKey || (code && c === code));
}

function emptyNameTotals() {
  return {
    in_qty: 0,
    in_weight: 0,
    out_qty: 0,
    out_weight: 0,
    balance_qty: 0,
    balance_weight: 0,
    sku_count: 0
  };
}

/** 按品名汇总当月进/出与期末结存（同品名多编码合并） */
function buildWarehouseNameSummary(groups) {
  const byName = new Map();
  (groups || []).forEach(g => {
    const name = String(g.product_name ?? '').trim() || '（未命名）';
    const st = g.subtotal || {};
    if (!byName.has(name)) {
      byName.set(name, { product_name: name, ...emptyNameTotals() });
    }
    const row = byName.get(name);
    row.in_qty += num(st.in_qty);
    row.in_weight += num(st.in_weight);
    row.out_qty += num(st.out_qty);
    row.out_weight += num(st.out_weight);
    row.balance_qty += num(st.balance_qty);
    row.balance_weight += num(st.balance_weight);
    row.sku_count += 1;
  });

  const rows = [...byName.values()].sort((a, b) =>
    a.product_name.localeCompare(b.product_name, 'zh-CN')
  );
  const total = { product_name: '合计', ...emptyNameTotals(), sku_count: (groups || []).length };
  rows.forEach(r => {
    total.in_qty += r.in_qty;
    total.in_weight += r.in_weight;
    total.out_qty += r.out_qty;
    total.out_weight += r.out_weight;
    total.balance_qty += r.balance_qty;
    total.balance_weight += r.balance_weight;
  });

  return { rows, total };
}

function collectWarehouseNameOptions(groups) {
  return [...new Set((groups || []).map(g => String(g.product_name ?? '').trim() || '（未命名）'))].sort(
    (a, b) => a.localeCompare(b, 'zh-CN')
  );
}

function enrichWarehousePayload(payload) {
  const groups = payload.groups || [];
  return {
    ...payload,
    nameSummary: buildWarehouseNameSummary(groups),
    nameOptions: collectWarehouseNameOptions(groups)
  };
}

function filterWarehousePayload(payload, filterCodes) {
  if (!filterCodes.length) return enrichWarehousePayload(payload);
  const groups = payload.groups.filter(g =>
    matchesProductFilter(g.group_key, g.product_code, filterCodes)
  );
  const list = groups.flatMap(g => g.rows.map(r => ({ ...r })));
  annotateGroupSpans(list);
  return enrichWarehousePayload({ list, groups, total: list.length });
}

function collectProductOptions(warehousePayloads) {
  const map = new Map();
  warehousePayloads.forEach(wh => {
    wh.groups.forEach(g => {
      if (!g.group_key || map.has(g.group_key)) return;
      map.set(g.group_key, {
        value: g.group_key,
        product_code: g.product_code,
        product_name: g.product_name,
        product_model: g.product_model,
        product_desc: g.product_desc,
        label: productOptionLabel(g)
      });
    });
  });
  return [...map.values()].sort((a, b) =>
    String(a.product_code || a.value).localeCompare(
      String(b.product_code || b.value),
      'zh-CN'
    )
  );
}

/**
 * 库存结算对账单：按仓库分 tab，按产品编码分组
 * @param {{ month?: string, product_codes?: string|string[] }} q
 */
async function inventorySettlementList(q) {
  const { startDate, endDate, monthLabel } = parseMonth(q.month);
  const filterCodes = parseProductCodes(q);
  const warehouses = await fetchActiveWarehouses();

  const fullByWarehouse = [];
  for (const wh of warehouses) {
    const settlement = await buildWarehouseSettlement(
      startDate,
      endDate,
      wh.warehouse_code
    );
    fullByWarehouse.push({
      warehouse_code: wh.warehouse_code,
      warehouse_name: wh.warehouse_name,
      ...enrichWarehousePayload(settlement)
    });
  }

  const productOptions = collectProductOptions(fullByWarehouse);
  const warehousesOut = fullByWarehouse.map(wh => {
    const filtered = filterWarehousePayload(
      { list: wh.list, groups: wh.groups, total: wh.total },
      filterCodes
    );
    return {
      warehouse_code: wh.warehouse_code,
      warehouse_name: wh.warehouse_name,
      ...filtered
    };
  });

  const list = warehousesOut.flatMap(wh => wh.list);

  return {
    list,
    warehouses: warehousesOut,
    productOptions,
    total: list.length,
    month: monthLabel,
    startDate,
    endDate
  };
}

function sheetNameFromWarehouse(name, code) {
  const raw = String(name || code || '仓库').replace(/[\\/*?:\[\]]/g, '_');
  return raw.slice(0, 31) || '仓库';
}

async function writeWarehouseSheet(sheet, groups) {
  const headers = [
    '产品编码',
    '品名',
    '型号',
    '日期',
    '类型',
    '上月结存件数',
    '上月结存重量(吨)',
    '进仓件数',
    '进仓重量(吨)',
    '出仓件数',
    '出仓重量(吨)',
    '结存件数',
    '结存重量(吨)',
    '存储天数'
  ];
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };

  let rowIndex = 2;
  for (const group of groups) {
    const startRow = rowIndex;
    group.rows.forEach((r, idx) => {
      const added = sheet.addRow([
        idx === 0 ? r.product_code : '',
        idx === 0 ? r.product_name : '',
        idx === 0 ? r.product_model : '',
        excelDateFromIso(r.biz_date),
        r.row_type_label,
        r.open_qty,
        r.open_weight,
        r.in_qty,
        r.in_weight,
        r.out_qty,
        r.out_weight,
        r.balance_qty,
        r.balance_weight,
        r.storage_days ?? ''
      ]);
      const dateCell = added.getCell(4);
      if (r.biz_date) {
        dateCell.numFmt = 'yyyy-mm-dd';
      }
      rowIndex += 1;
    });
    const endRow = rowIndex - 1;
    if (group.rows.length > 1) {
      for (let col = 1; col <= PRODUCT_COL_COUNT; col += 1) {
        sheet.mergeCells(startRow, col, endRow, col);
      }
    }
    const st = group.subtotal || {};
    sheet.addRow([
      '',
      '',
      '小计',
      '',
      '',
      '',
      '',
      st.in_qty ?? 0,
      st.in_weight ?? 0,
      st.out_qty ?? 0,
      st.out_weight ?? 0,
      st.balance_qty ?? 0,
      st.balance_weight ?? 0,
      ''
    ]);
    const summaryRow = sheet.getRow(rowIndex);
    summaryRow.font = { bold: true, color: { argb: 'FF606266' } };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F7FA' }
    };
    rowIndex += 1;
  }

  sheet.columns = [
    { width: 12 },
    { width: 14 },
    { width: 18 },
    { width: 12 },
    { width: 8 },
    { width: 12 },
    { width: 16 },
    { width: 10 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 10 }
  ];
}

async function writeInventorySettlementWorkbookToStream(res, q) {
  const payload = await inventorySettlementList(q);
  const workbook = new ExcelJS.Workbook();
  const targets = payload.warehouses.filter(wh => wh.total > 0);

  if (targets.length === 0) {
    const sheet = workbook.addWorksheet('库存结算对账单');
    await writeWarehouseSheet(sheet, []);
  } else {
    for (const wh of targets) {
      const sheet = workbook.addWorksheet(
        sheetNameFromWarehouse(wh.warehouse_name, wh.warehouse_code)
      );
      await writeWarehouseSheet(sheet, wh.groups);
    }
  }

  await workbook.xlsx.write(res);
}

module.exports = {
  inventorySettlementList,
  writeInventorySettlementWorkbookToStream,
  parseMonth,
  formatProductDesc,
  productGroupKey,
  annotateGroupSpans,
  daysInclusive,
  dayOfMonthFromIso,
  monthDayCount,
  applyStorageDays,
  mergeOpeningWithSameDayInbound,
  finalizeProductRows
};
