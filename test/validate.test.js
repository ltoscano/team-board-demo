'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTask, clean } = require('../src/validate');

test('accepts a complete task', () => {
  const result = validateTask({ title: 'Ship it', status: 'todo', owner: 'Priya' });
  assert.deepEqual(result, { ok: true, errors: [] });
});

test('requires a title', () => {
  const result = validateTask({ owner: 'Priya' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('title is required'));
});

test('requires an owner', () => {
  const result = validateTask({ title: 'Ship it', owner: '   ' });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(), /owner is required/);
});

test('rejects an unknown status', () => {
  const result = validateTask({ title: 'Ship it', owner: 'Priya', status: 'blocked' });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(), /status must be one of: todo, doing, done/);
});

test('rejects unknown fields', () => {
  const result = validateTask({ title: 'Ship it', owner: 'Priya', priority: 'high' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('unknown field: priority'));
});

test('rejects titles longer than 120 characters', () => {
  const result = validateTask({ title: 'x'.repeat(121), owner: 'Priya' });
  assert.equal(result.ok, false);
});

test('partial updates only check the fields that are present', () => {
  assert.equal(validateTask({ status: 'done' }, { partial: true }).ok, true);
  assert.equal(validateTask({ owner: '' }, { partial: true }).ok, false);
  assert.equal(validateTask({}, { partial: true }).ok, false);
});

test('clean trims strings and keeps only known fields', () => {
  assert.deepEqual(clean({ title: '  Ship it ', owner: ' Sam ', extra: 1 }), {
    title: 'Ship it',
    owner: 'Sam',
  });
});
