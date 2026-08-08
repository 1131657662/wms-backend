'use strict';

const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

async function run() {
  require('dotenv').config();
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'wms-backup-smoke-'));
  process.env.WMS_BACKUP_DIR = directory;
  try {
    const backupService = require('../services/backup/backupService');
    const result = await backupService.createBackup();
    const files = await backupService.listBackups();
    if (files.length !== 1 || files[0].filename !== result.filename) {
      throw new Error('备份文件未出现在列表接口的数据源中');
    }
    console.log(JSON.stringify({
      filename: result.filename,
      bytes: result.bytes,
      listed: files.length,
      validation: 'passed'
    }, null, 2));
  } finally {
    delete process.env.WMS_BACKUP_DIR;
    await fsp.rm(directory, { recursive: true, force: true });
  }
}

run().catch(err => {
  console.error(JSON.stringify({
    code: err.code || 'SMOKE_BACKUP_FAILED',
    message: err.message,
    diagnostic: err.diagnostic || ''
  }));
  process.exit(1);
});
