# BigDaysFE — Code Review & Recommended Changes

> Generated: 2026-02-22
> Stack: React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · React Router 7 · TanStack Query 5

---

## Table of Contents

1. [Critical Bugs](#1-critical-bugs)
2. [Security](#2-security)
3. [API & Data Fetching](#3-api--data-fetching)
4. [State Management](#4-state-management)
5. [Component Architecture](#5-component-architecture)
6. [Performance](#6-performance)
7. [Routing](#7-routing)
8. [Code Quality](#8-code-quality)
9. [Testing](#9-testing)
10. [Configuration & Tooling](#10-configuration--tooling)
11. [Documentation](#11-documentation)
12. [Prioritised Roadmap](#12-prioritised-roadmap)

---

## 1. Critical Bugs

### 1.1 Login does not authenticate — SHOWSTOPPER

**File:** `src/pages/LoginPage.tsx` (lines 22–24)

```tsx
// The actual login call and navigation are commented out:
// await login({ email, password });
// nav("/app");
nav(from, { replace: true }); // ← always navigates, never authenticates
```

**Fix:** Uncomment or re-implement the login mutation and only navigate on success.

---

### 1.2 `/auth/me` is never called

**File:** `src/context/AuthProvider.tsx` (line 28)

```tsx
enabled: false, // ← profile is never fetched on app load
```

The current user profile stays `null` indefinitely. Either remove the flag so the query runs on mount, or trigger a refetch after a successful login.

---

### 1.3 Unpredictable RSVP API response shape

**File:** `src/api/hooks/useRsvpsApi.ts` (lines 45–58)

```ts
const data = res.data?.data ?? res.data;
const arr = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];

return arr.map((r: any) => ({
  id: r.id ?? r.rsvpId ?? r.rsvpGuid ?? r._id, // 4 fallbacks
```

Four ID fallbacks and triple-nested data unwrapping indicate the backend returns inconsistent shapes. This is brittle and causes silent failures.

**Fix:** Align with the backend team on a canonical response envelope and remove the defensive guessing.

---

## 2. Security

### 2.1 Auth token in `localStorage` (XSS risk) — HIGH

Bearer tokens stored in `localStorage` are accessible to any script on the page.

**Recommendations:**
- Prefer `httpOnly` cookies if the backend supports it.
- At minimum, add a Content Security Policy (CSP) header to reduce XSS surface.
- Implement a token refresh interceptor in the axios client.
- Handle token expiration gracefully (redirect to login, not a broken state).

---

### 2.2 No input validation or sanitisation

No validation library is used. API payloads are sent with raw user input.

**Fix:** Install `zod` and add schemas for all forms. Validate before submitting.

```bash
npm install zod
```

---

### 2.3 Sensitive IP in `.env`

`VITE_API_BASE` appears to contain a hardcoded server IP (`31.97.188.38:5000`). Vite bakes `VITE_*` variables into the client bundle.

**Fix:**
- Ensure `.env` is in `.gitignore`.
- Use environment-specific `.env.production` / `.env.development` files.
- Document required variables in `.env.example` (committed to source control).

---

### 2.4 File upload — no validation

**File:** `src/api/hooks/useImportRsvps.ts`

No file size or MIME-type check before uploading.

**Fix:** Validate client-side before calling the API:

```ts
if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
  toast.error('Only CSV and XLSX files are accepted');
  return;
}
if (file.size > 5 * 1024 * 1024) {
  toast.error('File must be under 5 MB');
  return;
}
```

---

### 2.5 `console.log` in production code

**File:** `src/api/hooks/useEventsApi.ts` (lines 157, 171, 173)

Console logs may expose internal data in production.

**Fix:** Remove all `console.log` calls or gate them behind an environment check:

```ts
if (import.meta.env.DEV) console.log(data);
```

---

## 3. API & Data Fetching

### 3.1 Inconsistent HTTP methods

Some update operations use `POST` (e.g., `/question/Update`) while others use `PUT` (e.g., Tables).

**Fix:** Standardise with the backend — updates should use `PUT` or `PATCH`.

---

### 3.2 Missing error boundaries and error UI

There are no React Error Boundaries. An unhandled render error will crash the entire app silently.

**Fix:** Create an `ErrorBoundary` component and wrap the root route:

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <div>Something went wrong. <button onClick={() => this.setState({ error: null })}>Retry</button></div>;
    return this.props.children;
  }
}
```

---

### 3.3 No pagination

All events, RSVPs, and tables are fetched in a single request. With a large dataset this will cause slow loads and high memory usage.

**Fix:** Implement cursor or offset pagination in the API hooks and use TanStack Query's `useInfiniteQuery`.

---

### 3.4 No query `gcTime` configuration

TanStack Query defaults are fine, but high-churn queries (RSVPs) should have explicit `staleTime` and `gcTime` set per hook.

---

## 4. State Management

### 4.1 `UserProvider` commented out in `App.tsx`

```tsx
{/* <UserProvider> */}
  <BrowserRouter>…</BrowserRouter>
{/* </UserProvider> */}
```

Either implement and enable it, or delete the dead code.

---

### 4.2 `eventId` key is a magic string

**File:** `src/context/EventContext.tsx`

The localStorage key `"eventId"` is repeated as a plain string.

**Fix:** Extract to a constants file:

```ts
// src/constants.ts
export const STORAGE_KEYS = {
  EVENT_ID: 'eventId',
  AUTH_TOKEN: 'token',
} as const;
```

---

### 4.3 No event selection route guard

A user can navigate to `/app/rsvps` without an event selected. The modal appears, but no navigation guard prevents this state.

**Fix:** Create a `RequireEvent` guard component (similar to `RequireAuth`) and wrap event-specific routes.

---

## 5. Component Architecture

### 5.1 `RsvpDesignPage.tsx` — 1,458 lines

This single file manages block editing, global settings, previews, dragging, image uploads, and rendering. It has 20+ `useState` hooks.

**Recommended split:**

```
src/
  pages/
    RsvpDesignPage/
      index.tsx            ← orchestrator only
      BlockEditor.tsx
      BlockGallery.tsx
      PreviewModal.tsx
      GlobalSettings.tsx
      useDesignState.ts    ← extract all state into a custom hook
```

---

### 5.2 `FormField.tsx` — 21 props, 9 input types

The component violates the Single Responsibility Principle.

**Fix:** Split into focused components:
- `FormFieldText.tsx`
- `FormFieldCheckbox.tsx`
- `FormFieldSelect.tsx`
- Keep `FormField.tsx` as a thin routing wrapper.

---

### 5.3 Accessibility gaps

- Many interactive `div` elements use `onClick` instead of `<button>`.
- Modals lack `role="dialog"`, `aria-modal`, and focus trapping.
- Form fields missing `aria-describedby` links to error messages.

**Immediate fixes:**
- Replace `onClick` on `<div>` with `<button>`.
- Add `aria-label` to icon-only buttons.
- Trap focus inside modals (use `focus-trap-react` or native `inert`).

---

### 5.4 `Sidebar.tsx` — missing `ResizeObserver` cleanup

**File:** `src/components/Sidebar.tsx`

A `ResizeObserver` is set up inside a `useEffect` but may be missing the cleanup return.

**Fix:**

```ts
useEffect(() => {
  const observer = new ResizeObserver(handleResize);
  observer.observe(ref.current!);
  return () => observer.disconnect(); // ← ensure this exists
}, []);
```

---

### 5.5 Loading states — no skeleton UI

The loading screen shows a spinner and a plain text string ("Loading RSVPs…"). This causes layout shift when content loads.

**Fix:** Create a `SkeletonCard` / `SkeletonTable` component that mirrors the real layout.

---

## 6. Performance

### 6.1 Missing `useMemo` / `useCallback` on expensive operations

- `filteredEvents` in `EventsPage` is memoised (good).
- `activeEvent` derived value is not.
- RSVPs filter/sort in `RsvpsPage` recalculates on every render.
- Large arrays in `RsvpDesignPage` are recreated on every render.

---

### 6.2 No debounce on search inputs

**File:** `src/pages/RsvpsPage.tsx` (line 199)

Every keystroke triggers a filter recalculation (and potentially a re-render of a large list).

**Fix:** Debounce the search input by 200–300 ms using `useDeferredValue` (React 19) or a utility:

```tsx
const deferredSearch = useDeferredValue(searchTerm);
const filtered = useMemo(() => rsvps.filter(…), [deferredSearch, rsvps]);
```

---

### 6.3 Object URL memory leak risk

**File:** `src/pages/RsvpDesignPage.tsx` (line 429)

`URL.createObjectURL()` is called but cleanup depends on unmount timing.

**Fix:** Always revoke in the same `useEffect` cleanup:

```ts
useEffect(() => {
  const url = URL.createObjectURL(file);
  setPreviewUrl(url);
  return () => URL.revokeObjectURL(url);
}, [file]);
```

---

## 7. Routing

### 7.1 Commented-out imports in `routes.tsx`

`src/routers/routes.tsx` lines 10, 17–18, 21–22, 36–37 contain commented-out route imports.

**Fix:** Delete unused imports. If they represent planned features, track them in a ticket instead.

---

### 7.2 No dedicated 404 page

The catch-all redirects to `"/"` without explanation.

**Fix:** Create `src/pages/NotFoundPage.tsx` with a helpful message and a back-to-dashboard link.

---

### 7.3 Route params lack type safety

`useParams()` returns `Record<string, string | undefined>`. Downstream code treats these as defined without null checks.

**Fix:** Create typed param hooks:

```ts
// src/routers/useTypedParams.ts
import { useParams } from 'react-router-dom';
export function useEventIdParam() {
  const { eventId } = useParams<{ eventId: string }>();
  if (!eventId) throw new Error('eventId param missing');
  return eventId;
}
```

---

## 8. Code Quality

### 8.1 Magic numbers and strings

Overlay opacity values (0.25, 0.35, 0.4, 0.8, 0.9), RSVP status strings ("Yes", "No", "Maybe"), and localStorage keys are scattered as literals.

**Fix:** Centralise in `src/constants.ts`:

```ts
export const RSVP_STATUS = { YES: 'Yes', NO: 'No', MAYBE: 'Maybe' } as const;
export const OVERLAY_OPACITY = { LOW: 0.25, MED: 0.4, HIGH: 0.8 } as const;
```

---

### 8.2 `any` type usage

Multiple files use `type?: any`, `as any`, and untyped map callbacks.

**Fix:** Replace with proper discriminated unions and typed generics. Enable `@typescript-eslint/no-explicit-any` in the ESLint config to catch new occurrences.

---

### 8.3 Inline styles for colours

**File:** `src/pages/EventsPage.tsx` (lines 240, 249)

```tsx
style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
```

**Fix:** Use Tailwind classes (`bg-green-600 border-green-600`) or CSS variables.

---

### 8.4 Missing `src/utils/` directory

No shared utilities folder exists. Helper logic is duplicated across components.

**Create:**

```
src/utils/
  dateUtils.ts       — format, parse, compare dates
  validation.ts      — Zod schemas
  apiHelpers.ts      — response normalisation
  errorHandling.ts   — centralised error logger
```

---

## 9. Testing

**Current status: 0 test files.**
`msw` is installed but unused.

### Recommended setup

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add to `vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  coverage: { reporter: ['text', 'html'] },
}
```

### Priority test targets

| Priority | Target | Type |
|----------|--------|------|
| 1 | Auth flow (login → redirect) | Integration |
| 2 | API hooks (useEventsApi, useRsvpsApi) | Unit |
| 3 | Context providers | Unit |
| 4 | FormField validation | Unit |
| 5 | RSVP Design page blocks | Integration |
| 6 | Critical user journeys | E2E (Playwright) |

**Goal:** 80%+ coverage on `src/api/` and `src/context/` within the first sprint.

---

## 10. Configuration & Tooling

### 10.1 ESLint — enable type-aware rules

The README already recommends this but it is not implemented in `eslint.config.js`.

**Fix:**

```js
// eslint.config.js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
```

---

### 10.2 Vite — add chunk splitting

Large vendor bundles slow initial load. Add manual chunks:

```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        query: ['@tanstack/react-query'],
        router: ['react-router-dom'],
        xlsx: ['xlsx', 'file-saver'],
      },
    },
  },
},
```

---

### 10.3 Environment variable validation

Add startup validation so missing env vars fail loudly:

```ts
// src/env.ts
const required = ['VITE_API_BASE'] as const;
for (const key of required) {
  if (!import.meta.env[key]) throw new Error(`Missing env var: ${key}`);
}
export const ENV = {
  API_BASE: import.meta.env.VITE_API_BASE,
};
```

---

### 10.4 Bundle analysis

```bash
npm install -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [react(), tailwindcss(), visualizer({ open: true })],
```

Run `npm run build` to generate a bundle map and identify large dependencies.

---

## 11. Documentation

The `README.md` contains only the default Vite template text.

**Create:**

| File | Contents |
|------|----------|
| `docs/ARCHITECTURE.md` | Folder structure, data flow, auth flow |
| `docs/API_INTEGRATION.md` | Endpoints, request/response shapes, error codes |
| `docs/COMPONENT_PATTERNS.md` | Atomic design rules, naming conventions |
| `docs/DEPLOYMENT.md` | Build, env vars, CI/CD steps |
| `CONTRIBUTING.md` | Branch strategy, PR checklist, code style |
| `.env.example` | All required environment variables (no values) |

---

## 12. Prioritised Roadmap

### Week 1 — Critical Fixes

- [ ] Fix `LoginPage` — restore authentication call
- [ ] Fix `AuthProvider` — remove `enabled: false` on `/auth/me`
- [ ] Add `ErrorBoundary` around all routes
- [ ] Add zod input validation on all forms
- [ ] Remove `console.log` from production paths
- [ ] Validate file uploads before API calls

### Week 2–3 — Stability

- [ ] Create `src/utils/` and `src/constants.ts`
- [ ] Install Vitest and write tests for auth flow and API hooks
- [ ] Add `RequireEvent` route guard
- [ ] Fix `ResizeObserver` and Object URL memory leaks
- [ ] Replace `any` types with proper discriminated unions
- [ ] Add skeleton loading UI

### Month 1 — Quality

- [ ] Refactor `RsvpDesignPage` into sub-components
- [ ] Refactor `FormField` into typed sub-components
- [ ] Implement search debouncing across all pages
- [ ] Add pagination (TanStack `useInfiniteQuery`)
- [ ] Implement type-aware ESLint rules
- [ ] Add bundle splitting and visualizer
- [ ] Write `ARCHITECTURE.md` and `CONTRIBUTING.md`

### Month 2+ — Growth

- [ ] Move auth token to `httpOnly` cookie
- [ ] Add CSP headers via server config
- [ ] Integrate analytics
- [ ] Add Playwright E2E tests for critical flows
- [ ] Performance monitoring (Web Vitals)
- [ ] Internationalisation (`react-i18next`)
