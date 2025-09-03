/**
 * Parse pagination parameters from a query object.
 *
 * Ensures `page` and `limit` are valid numbers with safe defaults:
 * - `page` defaults to 1 (minimum 1).
 * - `limit` defaults to 10 (minimum 1, maximum 100).
 * - Calculates the `offset` for SQL queries or array slicing.
 *
 * @function parsePagination
 * @param {Object} [query={}] - Query parameters, usually from `req.query`.
 * @param {string|number} [query.page=1] - The requested page number (1-based).
 * @param {string|number} [query.limit=10] - The number of items per page.
 * @returns {{ page: number, limit: number, offset: number }} Normalized pagination values.
 *
 * @example
 * parsePagination({ page: "2", limit: "20" });
 * // => { page: 2, limit: 20, offset: 20 }
 *
 * @example
 * parsePagination({});
 * // => { page: 1, limit: 10, offset: 0 }
 */
export function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
