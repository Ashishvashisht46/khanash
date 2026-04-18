import axios from 'axios';

// Base URL: prefer VITE env var, fall back to relative /api (proxied by Vite dev server)
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
});

/* ─── Request interceptor ─────────────────────────────────────────────────── */
api.interceptors.request.use(
  (config) => {
    // Attach JWT from localStorage on every request
    const token = localStorage.getItem('rcm_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add a request timestamp for debugging
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => Promise.reject(error)
);

/* ─── Response interceptor ────────────────────────────────────────────────── */
api.interceptors.response.use(
  (response) => {
    // Optionally log response times in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.debug(
        `[API] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status} (${duration}ms)`
      );
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;

    // 401 — session expired or invalid token
    if (status === 401) {
      const existingToken = localStorage.getItem('rcm_token') ?? '';
      const isDemo = existingToken.startsWith('demo-jwt-');

      if (!isDemo) {
        // Clear stored credentials
        localStorage.removeItem('rcm_token');
        localStorage.removeItem('rcm_user');

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.startsWith('/login')) {
          window.location.replace('/login?reason=session_expired');
        }
      }
    }

    // 403 — authenticated but not authorised
    if (status === 403) {
      console.warn('[API] 403 Forbidden — insufficient permissions');
    }

    // Normalise error message for consumers
    const message =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      'An unexpected error occurred';

    // Attach normalised message so callers can do: error.message
    error.message = message;

    return Promise.reject(error);
  }
);

export default api;
