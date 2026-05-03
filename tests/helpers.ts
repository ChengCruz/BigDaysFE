import type { Page, Route } from '@playwright/test';

// ── Shared mock data ──────────────────────────────────────────────────────────

// Valid JWTs — decoded by jwtUtils.ts (must have sub, email, role, exp)
// Admin role (2) → isAdmin=true in UsersPage
export const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWd1aWQtMDAwMSIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiQWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fakesig';
// User role (3) → isAdmin=false in UsersPage (non-admin profile + change password view)
export const MOCK_JWT_MEMBER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWd1aWQtMDAwMiIsImVtYWlsIjoibWVtYmVyQHRlc3QuY29tIiwicm9sZSI6IlVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.fakesig';
// Staff role (6) → sidebar restricted to checkin/guests/tables only
export const MOCK_JWT_STAFF = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWd1aWQtMDAwMyIsImVtYWlsIjoic3RhZmZAdGVzdC5jb20iLCJyb2xlIjoiU3RhZmYiLCJleHAiOjk5OTk5OTk5OTl9.fakesig';

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

export const MOCK_STAFF_USER = {
  userId: 'u3',
  userGuid: 'user-guid-0003',
  fullName: 'Staff User',
  email: 'staff@test.com',
  role: 6, // Staff
  createdDate: '2026-01-03T00:00:00',
  lastUpdated: '2026-01-03T00:00:00',
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

// Second event owned by a different member — used in admin multi-event tests
export const MOCK_EVENT_2_GUID = '22222222-2222-2222-2222-222222222222';
export const MOCK_EVENT_2 = {
  eventGuid: MOCK_EVENT_2_GUID,
  eventName: 'Second Member Birthday',
  eventDate: '2026-08-15',
  eventTime: '18:00:00',
  eventLocation: 'City Hall',
  eventDescription: 'Another member event',
  noOfTable: 5,
  isDeleted: false,
  title: 'Second Member Birthday',
};

export const MOCK_WALLET = {
  walletId: 1,
  walletGuid: MOCK_WALLET_GUID,
  eventGuid: MOCK_EVENT_GUID,
  totalBudget: 50000,
  totalSpent: 12500,
  totalIncome: 0,
  remainingBudget: 37500,
  currency: 'MYR',
};

export const MOCK_TRANSACTION = {
  transactionId: 1,
  transactionGuid: 'txn-guid-0001',
  walletGuid: MOCK_WALLET_GUID,
  transactionName: 'Venue Deposit',
  amount: 5000,
  transactionDate: '2026-06-01',
  type: 1, // TransactionType.Debit = 1 (number)
  category: 'Venue',
  // paymentStatus and vendorName stored in remarks JSON (parsed by parseTransaction)
  remarks: JSON.stringify({
    _extended: { paymentStatus: 'Paid', vendorName: 'Grand Ballroom', vendorContact: '', dueDate: null },
    notes: '',
  }),
};

export const MOCK_TABLE_GUID = 'table-guid-0001';

export const MOCK_TABLE = {
  tableId: MOCK_TABLE_GUID,
  tableName: 'Table A',
  maxSeats: 8,
  guests: [],
  assignedCount: 0,
};

// Unassigned guest (flag → guestType = "Family")
export const MOCK_GUEST = {
  guestId: 'guest-guid-0001',
  name: 'Alice Smith',
  phoneNo: '+1234567890',
  pax: 2,
  flag: 'Family',
  notes: 'Vegetarian',
  tableId: null,
  eventGuid: MOCK_EVENT_GUID,
};

// Assigned guest (flag → guestType = "VIP", has tableId)
export const MOCK_GUEST_ASSIGNED = {
  guestId: 'guest-guid-0002',
  name: 'Bob Jones',
  phoneNo: '+0987654321',
  pax: 1,
  flag: 'VIP',
  notes: '',
  tableId: MOCK_TABLE_GUID,
  eventGuid: MOCK_EVENT_GUID,
};

export const MOCK_RSVP = {
  id: 'rsvp-guid-0001',
  rsvpId: 'rsvp-guid-0001',
  rsvpGuid: 'rsvp-guid-0001',
  guestName: 'Charlie Brown',
  noOfPax: 3,
  phoneNo: '+60123456789',
  remarks: 'Needs parking',
  eventId: MOCK_EVENT_GUID,
};

export const MOCK_DASHBOARD = {
  eventStats: {
    eventName: 'Test Wedding',
    eventDate: '2027-12-01',
    eventTime: '10:00:00',
    eventLocation: 'Test Venue',
    noOfTable: 10,
  },
  rsvpStats: {
    totalRsvpsReceived: 45,
    comingCount: 40,
    notComingCount: 5,
    pendingCount: 10,
    totalGuestsConfirmed: 50,
    responseRate: 90,
    newConfirmationsToday: 2,
  },
  tableStats: {
    totalTables: 10,
    arrangedTables: 8,
    assignedGuests: 35,
    unassignedGuests: 5,
    totalSeats: 80,
    occupiedSeats: 35,
  },
  budgetStats: {
    totalBudget: 50000,
    spentAmount: 12500,
    remainingAmount: 37500,
    spentPercentage: 25,
    status: 0, // 0 = under_budget
  },
  recentActivity: [
    {
      activityType: 'rsvp',
      description: 'Alice Smith confirmed attendance',
      details: 'Coming with 2 guests',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      icon: '✅',
    },
  ],
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
        json: { data: { accessToken: MOCK_JWT } },
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
        json: { accessToken: MOCK_JWT },
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

    // ── RSVPs ─────────────────────────────────────────────────────────────────
    if (/\/rsvp\/GetRsvp\/List\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_RSVP] },
      });
    }
    if (/\/rsvp\/Create/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_RSVP, id: 'rsvp-guid-0002', guestName: 'New Guest' } },
      });
    }
    if (/\/rsvp\/Update/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_RSVP },
      });
    }
    if (/\/rsvp\/Delete/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, message: 'RSVP deleted.' },
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

    // ── Tables ────────────────────────────────────────────────────────────────
    if (/\/TableArrangement\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { tables: [MOCK_TABLE] } },
      });
    }
    if (/\/TableArrangement\//i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_TABLE },
      });
    }

    // ── Guests ────────────────────────────────────────────────────────────────
    if (/\/Guest\/ByEvent\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_GUEST, MOCK_GUEST_ASSIGNED] },
      });
    }
    if (/\/Guest\/ByTable\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_GUEST_ASSIGNED] },
      });
    }
    if (/\/Guest\/Create/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_GUEST },
      });
    }
    if (/\/Guest\/Update/i.test(url) && (method === 'PUT' || method === 'PATCH')) {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_GUEST },
      });
    }
    if (/\/Guest\/.*\/AssignTable\//i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_GUEST, tableId: MOCK_TABLE_GUID } },
      });
    }
    if (/\/Guest\/.*\/UnassignTable/i.test(url) && method === 'POST') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: { ...MOCK_GUEST_ASSIGNED, tableId: null } },
      });
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    if (/\/Dashboard\/Summary\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_DASHBOARD },
      });
    }

    // ── RSVPs / other ─────────────────────────────────────────────────────────
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
  // Navigate to events page first to load event context (unless target is already events)
  if (!path.includes('/app/events')) {
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
  }
  if (!page.url().includes(path)) {
    await page.goto(path);
  }
  await page.waitForLoadState('networkidle');
}

/** Override events endpoint to return multiple events (simulates admin seeing all members' events). */
export async function mockApiMultipleEvents(page: Page) {
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    if (/\/event\//i.test(url) && route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [MOCK_EVENT, MOCK_EVENT_2] },
      });
    }
    return route.fallback();
  });
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
        json: { data: { accessToken: MOCK_JWT_MEMBER } },
      });
    }
    if (/\/User\/Refresh/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { accessToken: MOCK_JWT_MEMBER },
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
  // Navigate to events page first to load event context (unless target is already events)
  if (!path.includes('/app/events')) {
    await page.goto('/app/events');
    await page.waitForLoadState('networkidle');
  }
  if (!page.url().includes(path)) {
    await page.goto(path);
  }
  await page.waitForLoadState('networkidle');
}

/** Navigate to a page as Staff (role 6 — sidebar restricted to checkin/guests/tables). */
export async function gotoAuthenticatedAsStaff(page: Page, path: string) {
  await mockApi(page);
  // Override auth/user responses for staff role (LIFO — this handler runs first)
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/User\/Login/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { data: { accessToken: MOCK_JWT_STAFF } },
      });
    }
    if (/\/User\/Refresh/i.test(url)) {
      return route.fulfill({
        status: 200,
        json: { accessToken: MOCK_JWT_STAFF },
      });
    }
    if (/\/User\//i.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: MOCK_STAFF_USER },
      });
    }
    return route.fallback();
  });
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"]', MOCK_STAFF_USER.email);
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  await page.evaluate((eventGuid) => {
    localStorage.setItem('eventId', eventGuid);
  }, MOCK_EVENT_GUID);
  // Staff skips events page navigation — they don't have sidebar access to it
  if (!page.url().includes(path)) {
    await page.goto(path);
  }
  await page.waitForLoadState('networkidle');
}
