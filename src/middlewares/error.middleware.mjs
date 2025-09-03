/**
 * Express global error handling middleware.
 *
 * Catches errors thrown in routes/middleware and returns a consistent JSON response.
 * - Supports custom `err.status` and `err.details`.
 * - Maps SQLite constraint violations (`SQLITE_CONSTRAINT`) to HTTP 409 Conflict.
 * - Includes stack traces in non-production environments.
 *
 * @function errorHandler
 * @param {Error & {status?: number, details?: string[], code?: string}} err - The error object, may include custom fields.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function (unused).
 * @returns {void} Sends a JSON error response with appropriate HTTP status code.
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "details": ["First name is required"],
 *   "stack": "Error: Validation failed\n   at ..."
 * }
 */
export default function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // err may be a standard Error or an object with status/details
  const status = err.status || (err.code === 'SQLITE_CONSTRAINT' ? 409 : 500);
  const payload = { success: false, message: err.message || 'Internal Server Error' };
  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
  res.status(status).json(payload);
}
