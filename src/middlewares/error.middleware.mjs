export default function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // err may be a standard Error or an object with status/details
  const status = err.status || (err.code === 'SQLITE_CONSTRAINT' ? 409 : 500);
  const payload = { success: false, message: err.message || 'Internal Server Error' };
  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
  res.status(status).json(payload);
}
