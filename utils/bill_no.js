const BillConfig = require('../models/bill_config');
const BillSerial = require('../models/bill_serial');
const sequelize = require('../config/database');

/**
 * 生成业务单号
 * @param {string} billTypeCode - 单据类型编码 (inbound/outbound)
 * @returns {string} 生成的单号
 */
async function generateBillNo(billTypeCode) {
  const config = await BillConfig.findOne({ where: { bill_type_code: billTypeCode, del_flag: 0 } });
  if (!config) throw new Error(`单据配置不存在: ${billTypeCode}`);

  const today = new Date();
  const dateStr = today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  const isDateSeq = config.serial_rule === 'date_seq';
  const keyDate = isDateSeq ? dateStr : '00000000';

  // 乐观锁重试最多5次
  for (let retry = 0; retry < 5; retry++) {
    const txn = await sequelize.transaction();
    try {
      let serial = await BillSerial.findOne({
        where: { bill_type_code: billTypeCode, date_str: keyDate },
        transaction: txn,
        lock: txn.LOCK.UPDATE
      });

      if (!serial) {
        serial = await BillSerial.create({
          bill_type_code: billTypeCode,
          date_str: keyDate,
          serial_no: config.serial_start,
          lock_version: 0
        }, { transaction: txn });
      }

      const oldVersion = serial.lock_version;
      const newSerialNo = serial.serial_no + 1;

      const [updated] = await BillSerial.update(
        { serial_no: newSerialNo, lock_version: oldVersion + 1 },
        { where: { id: serial.id, lock_version: oldVersion }, transaction: txn }
      );

      if (updated === 0) {
        await txn.rollback();
        continue; // 乐观锁冲突，重试
      }

      await txn.commit();

      const digits = config.serial_digits || 3;
      const serialPart = String(serial.serial_no).padStart(digits, '0');
      return isDateSeq
        ? `${config.prefix}${dateStr}${serialPart}`
        : `${config.prefix}${serialPart}`;

    } catch (err) {
      await txn.rollback();
      throw err;
    }
  }
  throw new Error('生成单号失败：乐观锁重试次数已达上限');
}

module.exports = { generateBillNo };
