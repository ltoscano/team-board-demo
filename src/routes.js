'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { SORT_FIELDS } = require('./store');
const { validateTask, clean, STATUSES } = require('./validate');
const { toCsv } = require('./csv');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function sendJson(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendError(res, code, message) {
  sendJson(res, code, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 100000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const text = await readBody(req);
  try {
    return JSON.parse(text || 'null');
  } catch {
    return undefined;
  }
}

function listQuery(params) {
  const query = {
    status: params.get('status') || undefined,
    owner: params.get('owner') || undefined,
    sort: params.get('sort') || undefined,
  };
  if (query.status && !STATUSES.includes(query.status)) {
    return { error: `status must be one of: ${STATUSES.join(', ')}` };
  }
  if (query.sort && !SORT_FIELDS.includes(query.sort)) {
    return { error: `sort must be one of: ${SORT_FIELDS.join(', ')}` };
  }
  return { query };
}

function serveStatic(res, publicDir, pathname) {
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(publicDir, name);
  if (!file.startsWith(path.resolve(publicDir) + path.sep) || !fs.existsSync(file)) {
    return sendError(res, 404, 'not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

function createHandler({ store, publicDir }) {
  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;
    const method = req.method;

    try {
      if (pathname === '/api/tasks' && method === 'GET') {
        const { query, error } = listQuery(url.searchParams);
        if (error) return sendError(res, 400, error);
        return sendJson(res, 200, store.list(query));
      }

      if (pathname === '/api/tasks.csv' && method === 'GET') {
        const { query, error } = listQuery(url.searchParams);
        if (error) return sendError(res, 400, error);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="tasks.csv"',
        });
        return res.end(toCsv(store.list(query)));
      }

      if (pathname === '/api/summary' && method === 'GET') {
        return sendJson(res, 200, store.summary());
      }

      if (pathname === '/api/tasks' && method === 'POST') {
        const body = await readJson(req);
        if (body === undefined) return sendError(res, 400, 'invalid JSON');
        const check = validateTask(body);
        if (!check.ok) return sendError(res, 400, check.errors.join('; '));
        return sendJson(res, 201, store.create(clean(body)));
      }

      const match = pathname.match(/^\/api\/tasks\/(\d+)$/);
      if (match) {
        const id = Number(match[1]);
        if (method === 'GET') {
          const task = store.get(id);
          return task ? sendJson(res, 200, task) : sendError(res, 404, 'task not found');
        }
        if (method === 'PATCH') {
          const body = await readJson(req);
          if (body === undefined) return sendError(res, 400, 'invalid JSON');
          const check = validateTask(body, { partial: true });
          if (!check.ok) return sendError(res, 400, check.errors.join('; '));
          const task = store.update(id, clean(body));
          return task ? sendJson(res, 200, task) : sendError(res, 404, 'task not found');
        }
        if (method === 'DELETE') {
          if (!store.remove(id)) return sendError(res, 404, 'task not found');
          res.writeHead(204);
          return res.end();
        }
        return sendError(res, 405, 'method not allowed');
      }

      if (method === 'GET' && !pathname.startsWith('/api/')) {
        return serveStatic(res, publicDir, pathname);
      }

      return sendError(res, 404, 'not found');
    } catch (err) {
      return sendError(res, 500, err.message);
    }
  };
}

module.exports = { createHandler };
