// In-memory store for the access token.
// Keeping it here (not in localStorage) limits XSS exposure.
// refreshToken lives in an HttpOnly cookie (set by the backend).

const SESSION_HINT_KEY = "has_session";

let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

// A non-sensitive localStorage flag used only to avoid a noisy 401 on startup
// when no session exists. The real auth gate is the HttpOnly refresh cookie.
export const sessionHint = {
  set: () => localStorage.setItem(SESSION_HINT_KEY, "1"),
  clear: () => localStorage.removeItem(SESSION_HINT_KEY),
  exists: () => localStorage.getItem(SESSION_HINT_KEY) !== null,
};
