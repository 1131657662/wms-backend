'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const { BackupError, asBackupError } = require('./backupError');

const MAX_STDERR_LENGTH = 64 * 1024;

function collectStderr(stream) {
  let value = '';
  stream.setEncoding('utf8');
  stream.on('data', chunk => {
    if (value.length >= MAX_STDERR_LENGTH) return;
    value += chunk.slice(0, MAX_STDERR_LENGTH - value.length);
  });
  return () => value.replace(/\s+/g, ' ').trim();
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
}

function startTimeout(child, timeoutMs, markTimedOut) {
  let forceTimer = null;
  const timer = setTimeout(() => {
    markTimedOut();
    child.kill('SIGTERM');
    forceTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
  }, timeoutMs);
  return () => {
    clearTimeout(timer);
    if (forceTimer) clearTimeout(forceTimer);
  };
}

function createProcessError(kind, result, diagnostic, timedOut) {
  if (timedOut) {
    return new BackupError(`${kind}执行超时`, { code: `${kind}_TIMEOUT`, diagnostic });
  }
  return new BackupError(`${kind}执行失败`, {
    code: `${kind}_FAILED`,
    diagnostic: diagnostic || `exit=${result.code}, signal=${result.signal || 'none'}`
  });
}

function spawnChild(options, stdio) {
  return spawn(options.binary, options.args, {
    shell: false,
    windowsHide: true,
    stdio
  });
}

async function terminateChild(child, exitPromise) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  const forceTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
  try {
    await exitPromise;
  } catch {
    // A spawn error means there is no child process left to terminate.
  } finally {
    clearTimeout(forceTimer);
  }
}

async function awaitProcess(options, child, transfer) {
  const getStderr = collectStderr(child.stderr);
  const exitPromise = waitForExit(child);
  let timedOut = false;
  const stopTimeout = startTimeout(child, options.timeoutMs, () => { timedOut = true; });
  const guardedTransfer = transfer.catch(err => {
    if (child.exitCode === null) child.kill('SIGTERM');
    throw err;
  });
  try {
    const [result] = await Promise.all([exitPromise, guardedTransfer]);
    if (result.code !== 0 || timedOut) throw createProcessError(options.kind, result, getStderr(), timedOut);
  } catch (err) {
    await terminateChild(child, exitPromise);
    if (timedOut) {
      throw createProcessError(options.kind, {
        code: child.exitCode,
        signal: child.signalCode
      }, getStderr(), true);
    }
    throw asBackupError(err, `${options.kind}执行失败`, `${options.kind}_FAILED`);
  } finally {
    stopTimeout();
  }
}

async function runProcessToFile(options) {
  const output = fs.createWriteStream(options.outputPath, { flags: 'wx', mode: 0o600 });
  const child = spawnChild(options, ['ignore', 'pipe', 'pipe']);
  return awaitProcess(options, child, pipeline(child.stdout, output));
}

async function runProcessFromFile(options) {
  const input = fs.createReadStream(options.inputPath);
  const child = spawnChild(options, ['pipe', 'ignore', 'pipe']);
  return awaitProcess(options, child, pipeline(input, child.stdin));
}

module.exports = { runProcessFromFile, runProcessToFile };
