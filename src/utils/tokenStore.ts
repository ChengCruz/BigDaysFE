// In-memory store for the access token.
// Keeping it here (not in localStorage) limits XSS exposure.
// refreshToken lives in localStorage (persistent across page loads).

let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};
