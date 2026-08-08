'use strict';

const assert = require('node:assert/strict');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { runProcessFromFile, runProcessToFile } = require('./childProcessStreams');

async function createTempDirectory(t) {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'wms-process-test-'));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('runProcessToFile streams output larger than the execSync buffer limit', async t => {
  const directory = await createTempDirectory(t);
  const outputPath = path.join(directory, 'large.sql');
  await runProcessToFile({
    kind: 'TEST_DUMP',
    binary: process.execPath,
    args: ['-e', "process.stdout.write('x'.repeat(2 * 1024 * 1024))"],
    outputPath,
    timeoutMs: 10000
  });
  const stat = await fsp.stat(outputPath);
  assert.equal(stat.size, 2 * 1024 * 1024);
});

test('runProcessToFile reports a nonzero child exit', async t => {
  const directory = await createTempDirectory(t);
  const outputPath = path.join(directory, 'failed.sql');
  await assert.rejects(
    runProcessToFile({
      kind: 'TEST_DUMP',
      binary: process.execPath,
      args: ['-e', "process.stderr.write('expected failure'); process.exit(7)"],
      outputPath,
      timeoutMs: 10000
    }),
    err => err.code === 'TEST_DUMP_FAILED' && err.diagnostic.includes('expected failure')
  );
});

test('runProcessToFile terminates a timed out child', async t => {
  const directory = await createTempDirectory(t);
  const outputPath = path.join(directory, 'timeout.sql');
  await assert.rejects(
    runProcessToFile({
      kind: 'TEST_DUMP',
      binary: process.execPath,
      args: ['-e', 'setInterval(() => {}, 1000)'],
      outputPath,
      timeoutMs: 100
    }),
    err => err.code === 'TEST_DUMP_TIMEOUT'
  );
});

test('runProcessFromFile streams an input file to the child', async t => {
  const directory = await createTempDirectory(t);
  const inputPath = path.join(directory, 'input.sql');
  await fsp.writeFile(inputPath, 'expected restore input');
  const script = "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>process.exit(s==='expected restore input'?0:9))";
  await runProcessFromFile({
    kind: 'TEST_RESTORE',
    binary: process.execPath,
    args: ['-e', script],
    inputPath,
    timeoutMs: 10000
  });
  assert.ok(true);
});

test('runProcessFromFile preserves timeout classification after stdin closes', async t => {
  const directory = await createTempDirectory(t);
  const inputPath = path.join(directory, 'timeout-input.sql');
  await fsp.writeFile(inputPath, 'input accepted before timeout');

  await assert.rejects(
    runProcessFromFile({
      kind: 'TEST_RESTORE',
      binary: process.execPath,
      args: ['-e', "process.stdin.resume(); process.stdin.on('end', () => setInterval(() => {}, 1000))"],
      inputPath,
      timeoutMs: 100
    }),
    err => err.code === 'TEST_RESTORE_TIMEOUT'
  );
});
