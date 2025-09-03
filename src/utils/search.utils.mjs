export function escapeLike(s = '') {
  return String(s).replace(/[%_]/g, '\\$&');
}
