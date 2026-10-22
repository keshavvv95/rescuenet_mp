export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api';

// Disable mock mode fallback - strict real official API mode
export const USE_MOCK_FALLBACK = false;

