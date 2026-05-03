// In-memory store for the access token.
// Keeping it here (not in localStorage) limits XSS exposure.
// refreshToken lives in an HttpOnly cookie (set by the backend).

const SESSION_HINT_KEY = "has_session";
const CREW_TOKEN_KEY = "crew_access_token";

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

// Crew (Staff role 6) tokens have no refresh cookie, so we persist them in
// sessionStorage so page refreshes within the same tab don't log them out.
export const crewTokenStore = {
  set: (token: string) => sessionStorage.setItem(CREW_TOKEN_KEY, token),
  get: () => sessionStorage.getItem(CREW_TOKEN_KEY),
  clear: () => sessionStorage.removeItem(CREW_TOKEN_KEY),
};

const CREW_EVENT_GUID_KEY = "crew_event_guid";

// Stores the eventGuid the crew member logged in for, so EventContext can
// preset the event without calling the admin events-list endpoint.
export const crewEventGuidStore = {
  set: (guid: string) => sessionStorage.setItem(CREW_EVENT_GUID_KEY, guid),
  get: () => sessionStorage.getItem(CREW_EVENT_GUID_KEY),
  clear: () => sessionStorage.removeItem(CREW_EVENT_GUID_KEY),
};
