'use strict';

const STATUS_LABELS = { todo: 'To do', doing: 'Doing', done: 'Done' };
const NEXT_STATUS = { todo: 'doing', doing: 'done', done: 'todo' };

const $ = (id) => document.getElementById(id);

function currentQuery() {
  const params = new URLSearchParams();
  if ($('filter-status').value) params.set('status', $('filter-status').value);
  if ($('filter-owner').value.trim()) params.set('owner', $('filter-owner').value.trim());
  params.set('sort', $('sort').value);
  return params.toString();
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body;
}

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

function renderTasks(tasks) {
  const tbody = $('tasks');
  tbody.replaceChildren();
  for (const task of tasks) {
    const tr = document.createElement('tr');
    tr.className = 'status-' + task.status;
    const action = document.createElement('td');
    const move = document.createElement('button');
    move.textContent = 'Move to ' + STATUS_LABELS[NEXT_STATUS[task.status]];
    move.onclick = () => updateStatus(task);
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => removeTask(task);
    action.append(move, del);
    tr.append(cell(task.id), cell(task.title), cell(STATUS_LABELS[task.status]), cell(task.owner), action);
    tbody.append(tr);
  }
  $('export').href = '/api/tasks.csv?' + currentQuery();
}

function renderWorkload(summary) {
  const list = $('workload');
  list.replaceChildren();
  for (const [name, counts] of Object.entries(summary.byOwner)) {
    const li = document.createElement('li');
    li.textContent = `${name}: ${counts.todo} to do, ${counts.doing} doing, ${counts.done} done`;
    list.append(li);
  }
}

async function refresh() {
  const [tasks, summary] = await Promise.all([
    api('/api/tasks?' + currentQuery()),
    api('/api/summary'),
  ]);
  renderTasks(tasks);
  renderWorkload(summary);
}

async function updateStatus(task) {
  await api('/api/tasks/' + task.id, {
    method: 'PATCH',
    body: JSON.stringify({ status: NEXT_STATUS[task.status] }),
  });
  refresh();
}

async function removeTask(task) {
  if (!confirm(`Delete "${task.title}"?`)) return;
  await api('/api/tasks/' + task.id, { method: 'DELETE' });
  refresh();
}

$('new-task').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const error = $('form-error');
  try {
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: form.title.value, owner: form.owner.value }),
    });
    form.reset();
    error.hidden = true;
    refresh();
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  }
});

for (const id of ['filter-status', 'filter-owner', 'sort']) {
  $(id).addEventListener('change', refresh);
}

refresh();
