'use strict';

const backupService = require('../services/backup/backupService');
const { BackupError } = require('../services/backup/backupError');
const { sendSuccess } = require('../utils/apiResponse');
const { HttpError } = require('../utils/httpError');

async function callService(action) {
  try {
    return await action();
  } catch (err) {
    if (err instanceof BackupError) {
      throw new HttpError(err.status, err.message, { expose: true });
    }
    throw err;
  }
}

exports.create = async (_req, res) => {
  const result = await callService(() => backupService.createBackup());
  return sendSuccess(res, result, '备份成功');
};

exports.list = async (_req, res) => {
  const list = await callService(() => backupService.listBackups());
  return sendSuccess(res, { list, total: list.length });
};

exports.download = async (req, res) => {
  const file = await callService(() => backupService.getBackupFile(req.params.filename));
  return res.download(file.filepath, file.filename);
};

exports.restore = async (req, res) => {
  await callService(() => backupService.restoreBackupFile(req.body.filename));
  return sendSuccess(res, null, '数据恢复成功');
};

exports.remove = async (req, res) => {
  await callService(() => backupService.removeBackup(req.params.filename));
  return sendSuccess(res, null, '删除成功');
};
