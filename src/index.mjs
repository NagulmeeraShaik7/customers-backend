import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

import customerRouter from './apps/routes/customer.route.mjs';
import errorHandler from './middlewares/error.middleware.mjs';
import { initDb } from './apps/models/customer.model.mjs';

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// register routers
app.use('/api/customers', customerRouter);

// global error handler
app.use(errorHandler);

const port = process.env.PORT || 5000;

try {
  // initDb will auto-create file if it doesn’t exist
  initDb(process.env.SQLITE_FILE || 'src/data/customers.db');

  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
}
