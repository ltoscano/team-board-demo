'use strict';

const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: 'Title' },
  { key: 'status', header: 'Status' },
  { key: 'owner', header: 'Owner' },
];

function escapeCell(value) {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function toCsv(tasks) {
  const lines = [COLUMNS.map((c) => c.header).join(',')];
  for (const task of tasks) {
    lines.push(COLUMNS.map((c) => escapeCell(task[c.key])).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

module.exports = { toCsv, escapeCell };
