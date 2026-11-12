'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

const SEED = path.join(__dirname, '..', 'data', 'tasks.json');

async function withServer(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-board-'));
  const dataFile = path.join(dir, 'tasks.json');
  fs.copyFileSync(SEED, dataFile);
  const server = createApp({ dataFile });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

function send(url, method, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('GET /api/tasks returns all tasks', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/tasks`);
    assert.equal(res.status, 200);
    const tasks = await res.json();
    assert.equal(tasks.length, 7);
    assert.deepEqual(Object.keys(tasks[0]), ['id', 'title', 'status', 'owner']);
  });
});

test('GET /api/tasks?owner= filters by the person responsible', async () => {
  await withServer(async (base) => {
    const tasks = await (await fetch(`${base}/api/tasks?owner=Sam`)).json();
    assert.deepEqual(tasks.map((t) => t.id), [4, 5]);
  });
});

test('GET /api/tasks?sort=owner sorts by name', async () => {
  await withServer(async (base) => {
    const tasks = await (await fetch(`${base}/api/tasks?sort=owner`)).json();
    assert.equal(tasks[0].owner, 'Elena');
    assert.equal(tasks[tasks.length - 1].owner, 'Sam');
  });
});

test('GET /api/tasks rejects an unknown sort key', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/tasks?sort=priority`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /sort must be one of/);
  });
});

test('POST /api/tasks creates a task', async () => {
  await withServer(async (base) => {
    const res = await send(`${base}/api/tasks`, 'POST', { title: 'Book venue', owner: 'Elena' });
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), { id: 8, title: 'Book venue', status: 'todo', owner: 'Elena' });
  });
});

test('POST /api/tasks without an owner is rejected', async () => {
  await withServer(async (base) => {
    const res = await send(`${base}/api/tasks`, 'POST', { title: 'Book venue' });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /owner is required/);
  });
});

test('POST /api/tasks with invalid JSON is rejected', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/tasks`, { method: 'POST', body: '{nope' });
    assert.equal(res.status, 400);
  });
});

test('PATCH /api/tasks/:id reassigns a task', async () => {
  await withServer(async (base) => {
    const res = await send(`${base}/api/tasks/3`, 'PATCH', { owner: 'Marco' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).owner, 'Marco');
    const again = await (await fetch(`${base}/api/tasks/3`)).json();
    assert.equal(again.owner, 'Marco');
  });
});

test('DELETE /api/tasks/:id removes a task', async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/api/tasks/2`, { method: 'DELETE' })).status, 204);
    assert.equal((await fetch(`${base}/api/tasks/2`)).status, 404);
  });
});

test('GET /api/tasks.csv exports the filtered list', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/tasks.csv?owner=Priya`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/csv/);
    const lines = (await res.text()).trim().split('\r\n');
    assert.deepEqual(lines, [
      'ID,Title,Status,Owner',
      '1,Set up staging database,done,Priya',
      '3,Fix login timeout on mobile,todo,Priya',
    ]);
  });
});

test('GET /api/summary groups work by owner', async () => {
  await withServer(async (base) => {
    const summary = await (await fetch(`${base}/api/summary`)).json();
    assert.equal(summary.total, 7);
    assert.deepEqual(Object.keys(summary.byOwner).sort(), ['Elena', 'Marco', 'Priya', 'Sam']);
  });
});

test('GET / serves the board page', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /<h1>Team Board<\/h1>/);
  });
});
