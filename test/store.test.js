'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { TaskStore } = require('../src/store');

const SEED = path.join(__dirname, '..', 'data', 'tasks.json');

function freshStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-board-'));
  const file = path.join(dir, 'tasks.json');
  fs.copyFileSync(SEED, file);
  return new TaskStore(file);
}

test('lists tasks ordered by id by default', () => {
  const ids = freshStore().list().map((t) => t.id);
  assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7]);
});

test('filters by owner, ignoring case', () => {
  const tasks = freshStore().list({ owner: 'priya' });
  assert.deepEqual(tasks.map((t) => t.id), [1, 3]);
  assert.ok(tasks.every((t) => t.owner === 'Priya'));
});

test('combines status and owner filters', () => {
  const tasks = freshStore().list({ status: 'todo', owner: 'Marco' });
  assert.deepEqual(tasks.map((t) => t.id), [6]);
});

test('sorts by owner, then by id', () => {
  const owners = freshStore().list({ sort: 'owner' }).map((t) => t.owner);
  assert.deepEqual(owners, ['Elena', 'Marco', 'Marco', 'Priya', 'Priya', 'Sam', 'Sam']);
});

test('create assigns the next id and defaults status to todo', () => {
  const store = freshStore();
  const task = store.create({ title: 'New thing', owner: 'Elena' });
  assert.deepEqual(task, { id: 8, title: 'New thing', status: 'todo', owner: 'Elena' });
  assert.equal(store.list().length, 8);
});

test('update and remove report missing tasks', () => {
  const store = freshStore();
  assert.equal(store.update(99, { status: 'done' }), null);
  assert.equal(store.remove(99), false);
  assert.equal(store.remove(1), true);
  assert.equal(store.get(1), null);
});

test('summary counts tasks by status and by owner', () => {
  const summary = freshStore().summary();
  assert.equal(summary.total, 7);
  assert.deepEqual(summary.byStatus, { todo: 3, doing: 2, done: 2 });
  assert.deepEqual(summary.byOwner.Sam, { todo: 1, doing: 1, done: 0 });
});
