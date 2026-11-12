'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { toCsv, escapeCell } = require('../src/csv');

test('first line is the header row', () => {
  const lines = toCsv([]).split('\r\n');
  assert.equal(lines[0], 'ID,Title,Status,Owner');
});

test('each task becomes one row in column order', () => {
  const csv = toCsv([{ id: 3, title: 'Fix login', status: 'todo', owner: 'Priya' }]);
  assert.equal(csv, 'ID,Title,Status,Owner\r\n3,Fix login,todo,Priya\r\n');
});

test('cells with commas or quotes are escaped', () => {
  assert.equal(escapeCell('Plan, then build'), '"Plan, then build"');
  assert.equal(escapeCell('Say "hi"'), '"Say ""hi"""');
  assert.equal(escapeCell(undefined), '');
});
