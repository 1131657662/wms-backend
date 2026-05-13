'use strict';

function parsePositiveInt(val, fallback) {
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

/** 常规列表接口单页上限（防恶意超大 limit） */
const API_MAX_PAGE_SIZE = Math.min(
  100000,
  Math.max(10, parseInt(process.env.API_MAX_PAGE_SIZE || '1000', 10) || 1000)
);

/**
 * 入库/出库单列表等「前端可能一次拉大量」的接口上限（仍硬顶 100000）
 * 可通过 WMS_BULK_LIST_MAX 调整，须小于等于 100000。
 */
const BULK_LIST_MAX = Math.min(
  100000,
  Math.max(
    API_MAX_PAGE_SIZE,
    parseInt(process.env.WMS_BULK_LIST_MAX || '50000', 10) || 50000
  )
);

function clampPage(page) {
  return parsePositiveInt(page, 1);
}

/**
 * @param {unknown} pageSize
 * @param {number} [fallback=10]
 * @param {number} [routeMax] 本路由最大每页条数；不传则用 API_MAX_PAGE_SIZE
 */
function clampPageSize(pageSize, fallback = 10, routeMax) {
  const base = parsePositiveInt(pageSize, fallback);
  const cap =
    routeMax != null && Number.isFinite(routeMax) && routeMax >= 1
      ? Math.min(routeMax, 100000)
      : API_MAX_PAGE_SIZE;
  return Math.min(base, cap);
}

module.exports = {
  clampPage,
  clampPageSize,
  API_MAX_PAGE_SIZE,
  BULK_LIST_MAX
};
