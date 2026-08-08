'use strict';

class BackupError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'BackupError';
    this.code = options.code || 'BACKUP_ERROR';
    this.status = options.status || 500;
    this.diagnostic = options.diagnostic || '';
    Error.captureStackTrace?.(this, BackupError);
  }
}

function asBackupError(err, message, code) {
  if (err instanceof BackupError) return err;
  return new BackupError(message, {
    code,
    diagnostic: err instanceof Error ? err.message : String(err)
  });
}

module.exports = { BackupError, asBackupError };
