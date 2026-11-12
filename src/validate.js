'use strict';

const STATUSES = ['todo', 'doing', 'done'];
const FIELDS = ['title', 'status', 'owner'];
const MAX_TITLE = 120;

function validateTask(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['body must be a JSON object'] };
  }

  const errors = [];

  for (const key of Object.keys(input)) {
    if (!FIELDS.includes(key)) errors.push(`unknown field: ${key}`);
  }

  if (!partial || 'title' in input) {
    if (typeof input.title !== 'string' || input.title.trim() === '') {
      errors.push('title is required');
    } else if (input.title.length > MAX_TITLE) {
      errors.push(`title must be at most ${MAX_TITLE} characters`);
    }
  }

  if (!partial || 'owner' in input) {
    if (typeof input.owner !== 'string' || input.owner.trim() === '') {
      errors.push('owner is required (the person responsible for the task)');
    }
  }

  if ('status' in input && !STATUSES.includes(input.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }

  if (partial && Object.keys(input).length === 0) {
    errors.push('nothing to update');
  }

  return { ok: errors.length === 0, errors };
}

function clean(input) {
  const out = {};
  for (const key of FIELDS) {
    if (key in input) {
      out[key] = typeof input[key] === 'string' ? input[key].trim() : input[key];
    }
  }
  return out;
}

module.exports = { validateTask, clean, STATUSES };
