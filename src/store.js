'use strict';

const fs = require('node:fs');

const SORT_FIELDS = ['id', 'title', 'status', 'owner'];

class TaskStore {
  constructor(file) {
    this.file = file;
  }

  readAll() {
    const raw = fs.readFileSync(this.file, 'utf8');
    return JSON.parse(raw);
  }

  writeAll(tasks) {
    fs.writeFileSync(this.file, JSON.stringify(tasks, null, 2) + '\n');
  }

  list({ status, owner, sort } = {}) {
    let tasks = this.readAll();
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (owner) {
      const wanted = owner.trim().toLowerCase();
      tasks = tasks.filter((t) => t.owner.toLowerCase() === wanted);
    }
    const key = sort || 'id';
    return tasks.sort((a, b) => compare(a[key], b[key]) || a.id - b.id);
  }

  get(id) {
    return this.readAll().find((t) => t.id === id) || null;
  }

  create(fields) {
    const tasks = this.readAll();
    const id = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const task = { id, title: fields.title, status: fields.status || 'todo', owner: fields.owner };
    tasks.push(task);
    this.writeAll(tasks);
    return task;
  }

  update(id, fields) {
    const tasks = this.readAll();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, fields);
    this.writeAll(tasks);
    return task;
  }

  remove(id) {
    const tasks = this.readAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    this.writeAll(tasks);
    return true;
  }

  summary() {
    const tasks = this.readAll();
    const byStatus = { todo: 0, doing: 0, done: 0 };
    const byOwner = {};
    for (const t of tasks) {
      byStatus[t.status] += 1;
      byOwner[t.owner] = byOwner[t.owner] || { todo: 0, doing: 0, done: 0 };
      byOwner[t.owner][t.status] += 1;
    }
    return { total: tasks.length, byStatus, byOwner };
  }
}

function compare(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

module.exports = { TaskStore, SORT_FIELDS };
