'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const Stock = require('../models/stock');
const { checkAllStocks } = require('./stockAlertCheck');

test('checkAllStocks propagates database failures to the task runner', async t => {
  const failure = new Error('simulated stock query failure');
  t.mock.method(Stock, 'findAll', async () => { throw failure; });
  t.mock.method(console, 'error', () => {});

  await assert.rejects(checkAllStocks(), err => err === failure);
});
