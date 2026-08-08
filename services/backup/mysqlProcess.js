'use strict';

const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { runProcessFromFile, runProcessToFile } = require('./childProcessStreams');

function quoteOption(value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `"${escaped}"`;
}

function serializeDefaults(config) {
  return [
    '[client]',
    `host=${quoteOption(config.host)}`,
    `port=${config.port}`,
    `user=${quoteOption(config.user)}`,
    `password=${quoteOption(config.password)}`,
    ''
  ].join('\n');
}

async function withDefaultsFile(config, action) {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'wms-mysql-'));
  const filepath = path.join(directory, 'client.cnf');
  try {
    await fsp.writeFile(filepath, serializeDefaults(config), { mode: 0o600, flag: 'wx' });
    if (process.platform !== 'win32') await fsp.chmod(filepath, 0o600);
    return await action(filepath);
  } finally {
    await fsp.rm(directory, { recursive: true, force: true });
  }
}

function buildDumpArgs(defaultsFile, database) {
  return [
    `--defaults-extra-file=${defaultsFile}`,
    '--single-transaction',
    '--quick',
    '--routines',
    '--events',
    '--triggers',
    '--no-tablespaces',
    '--hex-blob',
    '--default-character-set=utf8mb4',
    database
  ];
}

async function dumpDatabase(options) {
  return withDefaultsFile(options.database, defaultsFile => runProcessToFile({
    kind: 'MYSQLDUMP',
    binary: options.binary,
    args: buildDumpArgs(defaultsFile, options.database.database),
    outputPath: options.outputPath,
    timeoutMs: options.timeoutMs
  }));
}

async function restoreDatabase(options) {
  return withDefaultsFile(options.database, defaultsFile => runProcessFromFile({
    kind: 'MYSQL',
    binary: options.binary,
    args: [
      `--defaults-extra-file=${defaultsFile}`,
      '--default-character-set=utf8mb4',
      options.database.database
    ],
    inputPath: options.inputPath,
    timeoutMs: options.timeoutMs
  }));
}

module.exports = { buildDumpArgs, dumpDatabase, restoreDatabase, serializeDefaults };
