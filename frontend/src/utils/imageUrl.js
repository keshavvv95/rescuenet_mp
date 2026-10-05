import { API_BASE_URL } from '../config/api';

/**
 * Returns a fully qualified image URL.
 * Converts backend relative static paths (e.g., /static/uploads/...)
 * into full URLs pointing to the FastAPI backend host.
 */
export function getImageUrl(path) {
  if (!path) {
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80';
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // Strip '/api' from end of base URL if present
  const host = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${host}${cleanPath}`;
}
