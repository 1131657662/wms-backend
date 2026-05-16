'use strict';

const { finalizeProductRows, monthDayCount } = require('../services/reportInventorySettlementService');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const start = '2026-04-01';
const end = '2026-04-30';

// 003：期初 + 7 进 + 16 进/出（有期初时 7 日段为 9 天，16 进不填）
const rows003Open = finalizeProductRows(
  [
    {
      biz_date: start,
      row_type: 'opening',
      row_type_label: '期初',
      open_qty: 10,
      open_weight: 10,
      balance_qty: 10,
      balance_weight: 10
    },
    {
      biz_date: '2026-04-07',
      row_type: 'inbound',
      row_type_label: '进仓',
      in_qty: 1,
      in_weight: 1,
      balance_qty: 11,
      balance_weight: 11
    },
    {
      biz_date: '2026-04-16',
      row_type: 'inbound',
      row_type_label: '进仓',
      in_qty: 1,
      in_weight: 1,
      balance_qty: 12,
      balance_weight: 12
    },
    {
      biz_date: '2026-04-16',
      row_type: 'outbound',
      row_type_label: '出仓',
      out_qty: 1,
      out_weight: 1,
      balance_qty: 11,
      balance_weight: 11
    }
  ],
  start,
  end
);
assert(rows003Open[0].storage_days === 7, 'opening through day 7');
assert(rows003Open[1].storage_days === 9, 'inbound 7: days 8-16');
assert(rows003Open[2].storage_days == null, 'inbound 16 same segment empty');
assert(rows003Open[3].storage_days === 14, 'last outbound 30-16');

// 无期初：7 进、16 进+出
const rows003 = finalizeProductRows(
  [
    {
      biz_date: '2026-04-07',
      row_type: 'inbound',
      row_type_label: '进仓',
      in_qty: 1,
      in_weight: 1
    },
    {
      biz_date: '2026-04-16',
      row_type: 'inbound',
      row_type_label: '进仓',
      in_qty: 1,
      in_weight: 1
    },
    {
      biz_date: '2026-04-16',
      row_type: 'outbound',
      row_type_label: '出仓',
      out_qty: 1,
      out_weight: 1,
      balance_qty: 0,
      balance_weight: 0
    }
  ],
  start,
  end
);
assert(rows003[0].storage_days === 10, 'no opening: 16-7+1');
assert(rows003[1].storage_days == null, 'in 16 covered');
assert(rows003[2].storage_days == null, 'out cleared stock');

// 期初 + 7 日出清
const rowsClear = finalizeProductRows(
  [
    {
      biz_date: start,
      row_type: 'opening',
      row_type_label: '期初',
      open_qty: 5,
      open_weight: 5,
      balance_qty: 5,
      balance_weight: 5
    },
    {
      biz_date: '2026-04-07',
      row_type: 'outbound',
      row_type_label: '出仓',
      out_qty: 5,
      out_weight: 5,
      balance_qty: 0,
      balance_weight: 0
    }
  ],
  start,
  end
);
assert(rowsClear[0].storage_days === 7, 'opening to outbound day 7');
assert(rowsClear[1].storage_days == null, 'cleared outbound empty');

// 8 进 9 出（未出清）
const rows89 = finalizeProductRows(
  [
    {
      biz_date: '2026-04-08',
      row_type: 'inbound',
      row_type_label: '进仓',
      in_qty: 1,
      in_weight: 1,
      balance_qty: 1,
      balance_weight: 1
    },
    {
      biz_date: '2026-04-09',
      row_type: 'outbound',
      row_type_label: '出仓',
      out_qty: 0.5,
      out_weight: 0.5,
      balance_qty: 0.5,
      balance_weight: 0.5
    }
  ],
  start,
  end
);
assert(rows89[0].storage_days === 2, 'in 8 with next 9: 2 days incl 9');
assert(rows89[1].storage_days === 21, 'partial out last: 30-9');

assert(monthDayCount(end) === 30, 'april');

console.log('inventory settlement storage-days tests passed');
