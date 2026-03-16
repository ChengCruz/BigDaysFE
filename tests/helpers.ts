import type { Page, Route } from '@playwright/test';

// ── Shared mock data ──────────────────────────────────────────────────────────

// Valid JWTs — decoded by jwtUtils.ts (must have sub, email, role, exp)
// Admin role (2) → isAdmin=true in UsersPage
export const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWd1aWQtMDAwMSIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiQWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fakesig';
// User role (3) → isAdmin=false in UsersPage (non-admin profile + change password view)
export const MOCK_JWT_MEMBER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWd1aWQtMDAwMiIsImVtYWlsIjoibWVtYmVyQHRlc3QuY29tIiwicm9sZSI6IlVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.fakesig';

export const MOCK_EVENT_GUID = '11111111-1111-1111-1111-111111111111';
export const MOCK_WALLET_GUID = 'aaaa-bbbb-cccc-dddd';
export const MOCK_SHARE_TOKEN = 'testtoken123';

// Field names match what UsersPage/UserFormModal renders (fullName, createdDate, lastUpdated, role as number)
export const MOCK_USER = {
  userId: 'u1',
  userGuid: 'user-guid-0001',
  fullName: 'Admin User',
  email: 'admin@test.com',
  role: 2, // Admin
  createdDate: '2026-01-01T00:00:00',
  lastUpdated: '2026-01-01T00:00:00',
};

export const MOCK_MEMBER_USER = {
  userId: 'u2',
  userGuid: 'user-guid-0002',
  fullName: 'Member User',
  email: 'member@test.com',
  role: 3, // Member
  createdDate: '2026-01-02T00:00:00',
  lastUpdated: '2026-01-02T00:00:00',
};

export const MOCK_USER_LIST = [
  MOCK_USER,
  MOCK_MEMBER_USER,
];

// Field names match ApiEvent shape expected by toEvent() in useEventsApi.ts
// toEvent maps: eventGuid→id, eventName→title, eventDate→date, eventLocation→location
export const MOCK_EVENT = {
  eventGuid: MOCK_EVENT_GUID,
  eventName: 'Test Wedding',
  eventDate: '2026-12-01',
  eventTime: '10:00:00',
  eventLocation: 'Test Venue',
  eventDescription: 'A test event',
  noOfTable: 10,
  isDeleted: false,
  // convenience alias so tests can still do MOCK_EVENT.title
  title: 'Test Wedding',
};

export const MOCK_WALLET = {
  walletId: 1,
  walletGuid: MOCK_WALLET_GUID,
  eventGuid: MOCK_EVENT_GUID,
  totalBudget: 50000,
  totalSpent: 12500,
  totalIncome: 0,
  remainingBudget: 37500,
};

export const MOCK_TRANSACTION = {
  transactionId: 1,
  transactionGuid: 'txn-guid-0001',
  walletGuid: MOCK_WALLET_GUID,
  transactionName: 'Venue Deposit',
  amount: 5000,
  transactionDate: '2026-06-01',
  type: 'debit',
  category: 'venue',
  paymentStatus: 'paid',
  vendorName: 'Grand Ballroom',
  remarks: '',
};

// ── API mock helper ───────────────────────────────────────────────────────────

/** Intercept all API calls and return mock responses. Call this in beforeEach. */
export async function mockApi(page: Page) {
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    // ── Auth ──────────────────────────────────────────────────────────────────
    if (/\/User\/Login/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { accessToken: MOCK_JWT, user: MOCK_USER } },
      });
    }
    if (/\/User\/Register/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, message: 'Registered successfully' },
      });
    }
    if (/\/User\/Refresh/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { accessToken: MOCK_JWT, user: MOCK_USER } },
      });
    }
    if (/\/User\/UpdatePassword/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, message: 'Password updated successfully.' },
      });
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    // Actual endpoints: GET /User/GetUsersList, POST /users, PATCH /users/:id, DELETE /users/:id
    if (/\/User\/GetUsersList/i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_USER_LIST },
      });
    }
    // POST /users (no case-insensitive flag — endpoint is lowercase, unlike /User/ routes)
    if (/\/users$/.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_USER, userGuid: 'u3', fullName: 'New User' } },
      });
    }
    // PATCH /users/:id
    if (/\/users\/[^/]+$/.test(url) && method === 'PATCH') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_USER },
      });
    }
    // DELETE /users/:id
    if (/\/users\/[^/]+$/.test(url) && method === 'DELETE') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, message: 'User deleted.' },
      });
    }
    // Single user fetch — must come after specific routes
    if (/\/User\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_USER },
      });
    }

    // ── Events ────────────────────────────────────────────────────────────────
    if (/\/event\/Create/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_EVENT },
      });
    }
    if (/\/event\/Update/i.test(url) && (method === 'PUT' || method === 'PATCH')) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_EVENT },
      });
    }
    if (/\/event\/Deactivate/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_EVENT, isActive: false, raw: { isDeleted: true } } },
      });
    }
    if (/\/event\/Activate/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_EVENT, isActive: true, raw: { isDeleted: false } } },
      });
    }
    // Events list / single event GET — must come after specific event routes
    if (/\/event\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_EVENT] },
      });
    }

    // ── Wallet ────────────────────────────────────────────────────────────────
    if (/\/Wallet\/Setup/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_WALLET },
      });
    }
    if (/\/Wallet\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_WALLET },
      });
    }

    // ── Transactions ──────────────────────────────────────────────────────────
    if (/\/Transaction\/Create/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_TRANSACTION },
      });
    }
    if (/\/Transaction\/Update/i.test(url) && (method === 'PUT' || method === 'PATCH')) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_TRANSACTION },
      });
    }
    if (/\/Transaction\/Delete/i.test(url) && method === 'DELETE') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, message: 'Transaction deleted.' },
      });
    }
    if (/\/Transaction\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_TRANSACTION] },
      });
    }

    // ── Guests / RSVPs / other ────────────────────────────────────────────────
    return route.fulfill({
      status: 200,
      json: { isSuccess: true, data: [] },
    });
  });
}

/** Variant: mock events API to return empty list (triggers empty-state UI). */
export async function mockApiEmptyEvents(page: Page) {
  await mockApi(page);
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    if (/\/event\//i.test(url) && route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [] },
      });
    }
    return route.fallback();
  });
}

/** Variant: mock login to return 401 (invalid credentials). */
export async function mockApiLoginFail(page: Page) {
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    if (/\/User\/Login/i.test(url)) {
      return route.fulfill({
        status: 401,
        json: { isSuccess: false, message: 'Invalid email or password.' },
      });
    }
    return route.fallback();
  });
}

/** Set the session hint flag so AuthProvider attempts silent token refresh on startup. */
export async function setMockAuth(page: Page, eventGuid = MOCK_EVENT_GUID) {
  await page.evaluate(
    ({ eventGuid }) => {
      localStorage.setItem('has_session', '1');
      localStorage.setItem('eventId', eventGuid);
    },
    { eventGuid }
  );
}

/** Navigate to a page as Admin (role 2 — sees admin user list view). */
export async function gotoAuthenticated(page: Page, path: string) {
  await mockApi(page);
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"]', MOCK_USER.email);
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  // Ensure eventId is set for EventContext
  await page.evaluate((eventGuid) => {
    localStorage.setItem('eventId', eventGuid);
  }, MOCK_EVENT_GUID);
  if (!page.url().includes(path)) {
    await page.goto(path);
  }
  await page.waitForLoadState('networkidle');
}

/** Navigate to a page as Member (role 3 — sees non-admin profile + change password view). */
export async function gotoAuthenticatedAsMember(page: Page, path: string) {
  await mockApi(page);
  // Override auth/user responses for member role (LIFO — this handler runs first)
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/User\/Login/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { accessToken: MOCK_JWT_MEMBER, user: MOCK_MEMBER_USER } },
      });
    }
    if (/\/User\/Refresh/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { accessToken: MOCK_JWT_MEMBER, user: MOCK_MEMBER_USER } },
      });
    }
    if (/\/User\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_MEMBER_USER },
      });
    }
    return route.fallback();
  });
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"]', MOCK_MEMBER_USER.email);
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  await page.evaluate((eventGuid) => {
    localStorage.setItem('eventId', eventGuid);
  }, MOCK_EVENT_GUID);
  if (!page.url().includes(path)) {
    await page.goto(path);
  }
  await page.waitForLoadState('networkidle');
}
