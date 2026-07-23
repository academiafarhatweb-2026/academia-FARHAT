const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${SERVER_ORIGIN}${path}`;
}
