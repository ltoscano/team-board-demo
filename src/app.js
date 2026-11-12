'use strict';

const http = require('node:http');
const path = require('node:path');
const { TaskStore } = require('./store');
const { createHandler } = require('./routes');

const DEFAULT_DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');
const DEFAULT_PUBLIC_DIR = path.join(__dirname, '..', 'public');

function createApp({ dataFile = DEFAULT_DATA_FILE, publicDir = DEFAULT_PUBLIC_DIR } = {}) {
  const store = new TaskStore(dataFile);
  return http.createServer(createHandler({ store, publicDir }));
}

module.exports = { createApp };
