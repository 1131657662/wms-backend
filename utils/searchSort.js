'use strict';

function norm(s) {
  return String(s ?? '').toLowerCase();
}

/**
 * 匹配优先级：0 前缀 < 1 中间 < 2 后缀（数字越小越靠前）
 */
function matchRank(haystack, needle) {
  const h = norm(haystack);
  const n = norm(needle);
  if (!n || !h) return null;
  if (!h.includes(n)) return null;
  if (h.startsWith(n)) return 0;
  if (h.endsWith(n)) return 2;
  return 1;
}

function bestRank(row, needle, fieldGetters) {
  let best = null;
  for (const fn of fieldGetters) {
    const r = matchRank(fn(row), needle);
    if (r === null) continue;
    if (best === null || r < best) best = r;
  }
  return best;
}

function naturalCompare(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'zh-CN', {
    numeric: true,
    sensitivity: 'base'
  });
}

/**
 * @param {object[]} rows
 * @param {string} keyword
 * @param {(row: object) => string} primarySortKey
 * @param {((row: object) => string)[]} fieldGetters 用于匹配优先级
 */
function sortSearchResults(rows, keyword, primarySortKey, fieldGetters) {
  const k = String(keyword ?? '').trim();
  const copy = [...rows];
  if (!k) {
    copy.sort((a, b) => naturalCompare(primarySortKey(a), primarySortKey(b)));
    return copy;
  }
  copy.sort((a, b) => {
    const ra = bestRank(a, k, fieldGetters);
    const rb = bestRank(b, k, fieldGetters);
    if (ra === null && rb === null) {
      return naturalCompare(primarySortKey(a), primarySortKey(b));
    }
    if (ra === null) return 1;
    if (rb === null) return -1;
    if (ra !== rb) return ra - rb;
    return naturalCompare(primarySortKey(a), primarySortKey(b));
  });
  return copy;
}

module.exports = { sortSearchResults, naturalCompare, matchRank, bestRank };
