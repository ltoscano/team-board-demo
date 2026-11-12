'use strict';

const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;
const app = createApp({ dataFile: process.env.DATA_FILE || undefined });

app.listen(port, () => {
  console.log(`Team Board running at http://localhost:${port}`);
});
