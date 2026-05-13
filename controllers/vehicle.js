const Vehicle = require('../models/vehicle');
const { Op } = require('sequelize');
const { sortSearchResults } = require('../utils/searchSort');
const logService = require('../services/logService');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');
const ExcelJS = require('exceljs');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function throwIfVehicleDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  const paths = err.errors?.map(e => e.path).join(',') || '';
  const msg = err.errors?.map(e => e.message).join(',') || '';
  if (paths.includes('plate_number') || msg.includes('plate_number')) {
    throw new HttpError(400, '车号已存在');
  }
  throw new HttpError(400, '数据重复');
}

exports.list = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { plate_number: { [Op.like]: `%${keyword}%` } },
        { contact_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('车辆列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Vehicle.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '车辆不存在');
    return sendSuccess(res, item);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.search = async (req, res) => {
  try {
    const { keyword } = req.query;
    const limit = clampPageSize(req.query.pageSize, 500, 1000);
    const where = { del_flag: 0, status: 1 };
    if (keyword) {
      where[Op.or] = [
        { plate_number: { [Op.like]: `%${keyword}%` } },
        { contact_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Vehicle.findAll({ where, limit, raw: true });
    const sorted = sortSearchResults(
      rows,
      keyword,
      r => r.plate_number,
      [r => r.plate_number, r => r.contact_name]
    );
    return sendSuccess(res, { list: sorted, total: sorted.length });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('车辆搜索失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Vehicle, req.body, ['plate_number']);
    const item = await Vehicle.create({ ...req.body, create_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '创建车辆', operationDesc: `创建车辆「${item.plate_number}」`, businessType: 'vehicle', businessId: String(item.id), method: 'POST', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfVehicleDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建车辆失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    await clearSoftDeletedConflicts(Vehicle, req.body, ['plate_number']);
    const item = await Vehicle.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '车辆不存在');
    await item.update({ ...req.body, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '编辑车辆', operationDesc: `编辑车辆「${item.plate_number}」`, businessType: 'vehicle', businessId: String(item.id), method: 'PUT', params: req.body, ip: req.ip, status: 1 });
    return sendSuccess(res, item, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfVehicleDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新车辆失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '无权限');
    const item = await Vehicle.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!item) throw new HttpError(404, '车辆不存在');
    await item.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '删除车辆', operationDesc: `删除车辆「${item.plate_number}」`, businessType: 'vehicle', businessId: String(item.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.exportVehicles = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { plate_number: { [Op.like]: `%${keyword}%` } },
        { contact_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const rows = await Vehicle.findAll({ where, order: [['id', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('车辆数据');
    sheet.columns = [
      { header: '车牌号', key: 'plate_number', width: 16 },
      { header: '联系人', key: 'contact_name', width: 14 },
      { header: '联系电话', key: 'contact_phone', width: 16 },
      { header: '状态', key: 'status', width: 10 },
      { header: '备注', key: 'remark', width: 30 }
    ];

    rows.forEach(r => {
      sheet.addRow({
        plate_number: r.plate_number,
        contact_name: r.contact_name || '',
        contact_phone: r.contact_phone || '',
        status: r.status === 1 ? '启用' : '停用',
        remark: r.remark || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle_export.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('车辆导出失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('车辆导入模板');
    sheet.columns = [
      { header: '车牌号', key: 'plate_number', width: 16 },
      { header: '联系人', key: 'contact_name', width: 14 },
      { header: '联系电话', key: 'contact_phone', width: 16 },
      { header: '状态', key: 'status', width: 10 },
      { header: '备注', key: 'remark', width: 30 }
    ];
    sheet.addRow({
      plate_number: '粤A12345',
      contact_name: '张三',
      contact_phone: '13800138000',
      status: '启用',
      remark: ''
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle_import_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('模板下载失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
};

exports.importVehicles = [upload.single('file'), async (req, res) => {
  try {
    if (req.user.roleCode !== 'ADMIN') throw new HttpError(403, '仅管理员可导入');

    const file = req.file;
    if (!file) throw new HttpError(400, '请上传 Excel 文件');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new HttpError(400, 'Excel 文件为空');

    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const vals = row.values;
        rows.push({
          rowNumber,
          plate_number: String(vals[1] || '').trim(),
          contact_name: String(vals[2] || '').trim(),
          contact_phone: String(vals[3] || '').trim(),
          status: String(vals[4] || '').trim(),
          remark: String(vals[5] || '').trim()
        });
      }
    });

    if (rows.length === 0) throw new HttpError(400, 'Excel 文件中无数据行');

    // 物理清除软删除记录，释放车号占用
    const deletedCount = await Vehicle.destroy({ where: { del_flag: 1 }, force: true });
    if (deletedCount > 0) console.log(`[导入] 已物理清除 ${deletedCount} 条软删除车辆，释放车号占用`);

    const existingPlates = new Set((await Vehicle.findAll({ attributes: ['plate_number'], where: { del_flag: 0 }, raw: true })).map(v => v.plate_number.toLowerCase()));

    const errors = [];
    const toCreate = [];
    const seenPlates = new Set();

    for (const r of rows) {
      const rowErr = [];
      const plateLower = r.plate_number.toLowerCase();
      if (!r.plate_number) {
        rowErr.push('车牌号不能为空');
      } else if (seenPlates.has(plateLower)) {
        rowErr.push(`车牌号「${r.plate_number}」在导入文件中重复（第 ${r.rowNumber} 行）`);
      } else if (existingPlates.has(plateLower)) {
        rowErr.push(`车牌号「${r.plate_number}」已存在`);
      } else {
        seenPlates.add(plateLower);
      }
      let statusVal = 1;
      if (r.status) {
        const s = r.status;
        if (s === '启用' || s === '1') statusVal = 1;
        else if (s === '停用' || s === '0') statusVal = 0;
        else rowErr.push('状态无效，请填写"启用"或"停用"');
      }

      if (rowErr.length > 0) {
        errors.push({ row: r.rowNumber, errors: rowErr });
      } else {
        toCreate.push({
          plate_number: r.plate_number,
          contact_name: r.contact_name || null,
          contact_phone: r.contact_phone || null,
          status: statusVal,
          remark: r.remark || null,
          create_by: req.user.username
        });
      }
    }

    let successCount = 0;
    if (toCreate.length > 0) {
      for (const item of toCreate) {
        try {
          await Vehicle.create(item);
          successCount++;
        } catch (e) {
          if (e.name === 'SequelizeUniqueConstraintError') {
            errors.push({ row: -1, errors: [`车牌号「${item.plate_number}」冲突`] });
          } else {
            throw e;
          }
        }
      }
    }

    if (successCount > 0) {
      logService.log({ userId: req.user.id, username: req.user.username, module: '基础资料', operation: '导入车辆', operationDesc: `批量导入车辆，成功 ${successCount} 条，失败 ${errors.length} 条`, businessType: 'vehicle', method: 'POST', ip: req.ip, status: 1 });
    }
    return sendSuccess(
      res,
      { successCount, failCount: errors.length, errors },
      `成功导入 ${successCount} 条，失败 ${errors.length} 条`
    );
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('车辆导入失败:', err);
    if (!res.headersSent) return sendError(res, 500, '服务器内部错误');
  }
}];
