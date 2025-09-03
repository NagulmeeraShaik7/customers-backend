/**
 * Escape special characters in a string for safe use in SQL `LIKE` queries.
 *
 * Replaces `%` and `_` with their escaped versions (`\%` and `\_`)
 * so that they are treated as literal characters instead of wildcards.
 *
 * @function escapeLike
 * @param {string} [s=''] - The input string to escape.
 * @returns {string} The escaped string safe for SQL `LIKE` usage.
 *
 * @example
 * escapeLike("100% real_value");
 * // => "100\\% real\\_value"
 *
 * @example
 * const search = `%${escapeLike(userInput)}%`;
 * db.prepare("SELECT * FROM customers WHERE name LIKE ? ESCAPE '\\'").all(search);
 */
export function escapeLike(s = '') {
  return String(s).replace(/[%_]/g, '\\$&');
}
