
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './infrastructures/config/swagger.config.mjs';
import swaggerJSDoc from 'swagger-jsdoc';

import customerRouter from './apps/routes/customer.route.mjs';
import errorHandler from './middlewares/error.middleware.mjs';
import { initDb } from './apps/models/customer.model.mjs';

dotenv.config();


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Swagger setup
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Health check endpoint.
 *
 * @route GET /health
 * @returns {object} 200 - JSON response confirming service availability
 * @example
 * // Response:
 * { "ok": true }
 */
app.get('/health', (_req, res) => res.json({ ok: true }));

// Register routers
app.use('/api/customers', customerRouter);

// Global error handler (must be last middleware)
app.use(errorHandler);


const port = process.env.PORT || 5000;

try {
  /**
   * Initialize SQLite database.
   * - Automatically creates the database file if it doesn’t exist.
   * - Ensures required tables and indexes are present.
   */
  initDb(process.env.SQLITE_FILE || 'src/data/customers.db');

  /**
   * Start Express server.
   *
   * @listens {number} port - Server will listen on this port.
   */
  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
}
