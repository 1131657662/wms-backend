// 订单状态常量 — 统一管理，消除魔法字符串
const ORDER_STATUS = {
  DRAFT: 'draft',
  SUBMIT: 'submit',
  AUDITED: 'audited',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

const CHECK_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  ADJUSTED: 'adjusted',
  VOIDED: 'voided'
};

const STATUS_LABEL = {
  [ORDER_STATUS.DRAFT]: '草稿',
  [ORDER_STATUS.SUBMIT]: '已提交',
  [ORDER_STATUS.AUDITED]: '已审核',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [CHECK_STATUS.DRAFT]: '草稿',
  [CHECK_STATUS.CONFIRMED]: '已确认',
  [CHECK_STATUS.ADJUSTED]: '已调整',
  [CHECK_STATUS.VOIDED]: '已作废'
};

module.exports = { ORDER_STATUS, CHECK_STATUS, STATUS_LABEL };
