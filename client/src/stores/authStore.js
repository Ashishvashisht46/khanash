import { create } from 'zustand';
import { LS_TOKEN_KEY, LS_USER_KEY } from '../lib/constants.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Auth Store — manages JWT, user identity, and session state.

   Persistence strategy:
   • Token  → localStorage (key: rcm_token)
   • User   → localStorage (key: rcm_user) — non-sensitive profile data only
   • Both are read back on module init so the session survives page reloads.
───────────────────────────────────────────────────────────────────────────── */

// Helper — safely parse JSON from localStorage
function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Helper — safely write JSON to localStorage
function writeStorage(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // localStorage may be unavailable in certain private-browsing contexts
  }
}

// Rehydrate from localStorage on module load
const storedToken = localStorage.getItem(LS_TOKEN_KEY) ?? null;
const storedUser  = readStorage(LS_USER_KEY);

export const useAuthStore = create((set, get) => ({
  /* ── State ─────────────────────────────────────────────────────────────── */
  token:           storedToken,
  user:            storedUser,
  isLoading:       false,
  isAuthenticated: Boolean(storedToken && storedUser),

  /* ── Actions ───────────────────────────────────────────────────────────── */

  /**
   * Persist a new token + user object (called after a successful login).
   * @param {string} token - JWT string
   * @param {object} user  - User profile returned by the API
   */
  login(token, user) {
    localStorage.setItem(LS_TOKEN_KEY, token);
    writeStorage(LS_USER_KEY, user);

    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Clear session — remove token and user from memory and storage.
   */
  logout() {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);

    set({
      token:           null,
      user:            null,
      isAuthenticated: false,
      isLoading:       false,
    });
  },

  /**
   * Merge updated profile fields into the stored user.
   * Call this after a successful profile-update API response.
   * @param {Partial<object>} updates
   */
  setUser(updates) {
    const merged = { ...get().user, ...updates };
    writeStorage(LS_USER_KEY, merged);
    set({ user: merged });
  },

  /**
   * Handle a Google OAuth credential — exchange the Google ID token for an
   * internal JWT via the API (actual HTTP call lives in useAuth hook).
   * This action simply sets the loading state; the hook calls login() on success.
   */
  setLoading(isLoading) {
    set({ isLoading });
  },

  /**
   * Complete Google login: accepts credential from Google One Tap / OAuth pop-up.
   * The credential is a Google ID token (JWT). This action stores it temporarily
   * so hooks can read it; the real exchange happens server-side.
   * @param {string} credential - Google ID token
   */
  googleLogin(credential) {
    set({ isLoading: true });
    // The actual API call + login() is handled by useAuth.useGoogleLogin()
    // This action exists so components can trigger the loading state
    // without coupling to the mutation directly.
    return credential; // return so hooks can pipe it through
  },

  /**
   * Check whether the current token is still valid.
   * Returns true if a token exists (actual expiry check happens server-side
   * via the 401 response interceptor in api.js).
   * @returns {boolean}
   */
  isTokenValid() {
    const { token } = get();
    if (!token) return false;

    // Basic JWT expiry check (decode payload, no signature verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload?.exp) return true; // no exp claim → assume valid
      return payload.exp * 1000 > Date.now();
    } catch {
      return true; // if we can't decode, let the server decide
    }
  },

  /**
   * Quick helper — return the current user's role.
   * @returns {string|null}
   */
  getRole() {
    return get().user?.role ?? null;
  },

  /**
   * Check if the current user has at least one of the given roles.
   * @param {string[]} roles
   * @returns {boolean}
   */
  hasRole(...roles) {
    const role = get().getRole();
    return roles.includes(role);
  },
}));
