'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildDumpArgs, serializeDefaults } = require('./mysqlProcess');

test('buildDumpArgs uses production-proven consistency flags', () => {
  const args = buildDumpArgs('/tmp/client.cnf', 'wms');
  assert.equal(args[0], '--defaults-extra-file=/tmp/client.cnf');
  assert.ok(args.includes('--single-transaction'));
  assert.ok(args.includes('--quick'));
  assert.ok(args.includes('--no-tablespaces'));
  assert.ok(args.includes('--hex-blob'));
  assert.equal(args.at(-1), 'wms');
});

test('buildDumpArgs never contains the database password', () => {
  const password = 'secret-password-value';
  const args = buildDumpArgs('/tmp/client.cnf', 'wms');
  assert.equal(args.some(arg => arg.includes(password)), false);
});

test('serializeDefaults escapes quotes and newlines', () => {
  const text = serializeDefaults({
    host: '127.0.0.1',
    port: '3306',
    user: 'backup',
    password: 'line1"\nline2'
  });
  assert.ok(text.includes('password="line1\\"\\nline2"'));
  assert.equal(text.split('\n').length, 6);
});
