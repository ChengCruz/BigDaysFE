/**
 * Showcase screenshot capture — NOT a test, a capture utility.
 *
 * Logs in via the mock API, seeds richer-than-default data so each feature
 * looks full, and writes marketing PNGs to public/showcase/.
 *
 * Run just this file:
 *   npx playwright test showcase-capture --project=desktop
 *
 * Output: public/showcase/{rsvp,floorplan,wallet,guests}.png
 */
import { test, type Route, type Page } from '@playwright/test';
import {
  mockApi,
  MOCK_USER,
  MOCK_EVENT,
  MOCK_EVENT_GUID,
  MOCK_WALLET,
  MOCK_WALLET_GUID,
} from './helpers';

const OUT = 'public/showcase';

// Capture at a generous desktop size for crisp marketing shots.
test.use({ viewport: { width: 1440, height: 900 } });

// Branded identity for the screenshots — the sidebar shows the JWT-decoded
// email, so login must return a token carrying admin@bigdaysmanager.com.
// (JWT payload: { sub, email: admin@bigdaysmanager.com, role: Admin, exp: 9999999999 })
const BRAND_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWd1aWQtMDAwMSIsImVtYWlsIjoiYWRtaW5AYmlnZGF5c21hbmFnZXIuY29tIiwicm9sZSI6IkFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.fakesig';
const BRAND_USER = { ...MOCK_USER, email: 'admin@bigdaysmanager.com' };

/** Log in as the branded admin and land on /app/events with event context set.
 *  Mirrors helpers.gotoAuthenticated but returns a token carrying the branded
 *  email so the sidebar reads admin@bigdaysmanager.com. */
async function loginBranded(page: Page) {
  await mockApi(page);
  // Overlay branded auth/profile (LIFO — runs before the generic mockApi handler).
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/User\/Login/i.test(url)) {
      return route.fulfill({ status: 200, json: { data: { accessToken: BRAND_JWT } } });
    }
    if (/\/User\/Refresh/i.test(url)) {
      return route.fulfill({ status: 200, json: { accessToken: BRAND_JWT } });
    }
    if (/\/User\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: BRAND_USER } });
    }
    return route.fallback();
  });
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"]', BRAND_USER.email);
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  await page.evaluate((g) => localStorage.setItem('eventId', g), MOCK_EVENT_GUID);
  await page.goto('/app/events');
  await page.waitForLoadState('networkidle');
}

/** Suppress the first-run "Welcome to MyBigDays!" help nudge so it doesn't
 *  overlap the screenshots (HelpBubble reads this localStorage flag). */
async function hideHelpHint(page: Page) {
  await page.evaluate(() => localStorage.setItem('mbd_help_bubble_hint_seen', '1'));
}

// ── Enriched mock data ──────────────────────────────────────────────────────

const EVENT_WITH_SLUG = { ...MOCK_EVENT, slug: 'test-wedding' };

/** A fuller RSVP design: hero headline over a dark theme + event details, an
 *  attendance toggle, a guest-details card and a CTA — enough to look real. */
const RSVP_DESIGN = {
  rsvpDesignId: 1,
  eventGuid: MOCK_EVENT_GUID,
  eventId: 1,
  version: 4,
  isPublished: false,
  isDraft: true,
  shareToken: null,
  design: {
    theme: {
      background: { type: 'color', color: '#1c1917', assetUrl: '' },
      accentColor: '#c2843f',
      overlayOpacity: 0.35,
      layoutStyle: 'flush',
      contentWidth: 'standard',
    },
    layout: { width: 1200, maxHeight: 0 },
    previewModes: ['mobile', 'desktop'],
    flowPreset: 'serene',
    layoutStyle: 'flush',
    contentWidth: 'standard',
    blocks: [
      {
        id: 'hl1',
        type: 'headline',
        title: 'Sarah & James',
        subtitle: 'Together with their families, request the pleasure of your company',
        align: 'center',
        accent: 'text-white',
        accentClass: 'text-white',
      },
      {
        id: 'ev1',
        type: 'eventDetails',
        title: 'The Celebration',
        showDate: true,
        showTime: true,
        showLocation: true,
      },
      {
        id: 'cd1',
        type: 'countdown',
        label: 'Counting down to our big day',
      },
      {
        id: 'at1',
        type: 'attendance',
        title: 'Will you be attending?',
        subtitle: 'We would love to celebrate with you',
      },
      {
        id: 'gd1',
        type: 'guestDetails',
        title: 'Your details',
        subtitle: 'So we can save your seat',
        showFields: { name: true, phone: true, pax: true, remarks: true },
      },
      {
        id: 'cta1',
        type: 'cta',
        label: 'Send RSVP',
        ctaLabel: 'Send RSVP',
        align: 'center',
      },
    ],
  },
};

/** A furnished floor plan: several tables of varying shapes plus décor. */
const FLOOR_ITEMS = [
  // Décor first
  { id: 'stage', type: 'stage', x: 340, y: 30, width: 240, height: 90, meta: { label: 'Stage' } },
  { id: 'dance', type: 'danceFloor', x: 360, y: 150, width: 200, height: 160, meta: { label: 'Dance Floor' } },
  { id: 'pillar1', type: 'pillar', x: 120, y: 340, width: 44, height: 44, meta: { label: 'Pillar' } },
  { id: 'pillar2', type: 'pillar', x: 780, y: 340, width: 44, height: 44, meta: { label: 'Pillar' } },
  // Round tables around the dance floor
  { id: 't1', type: 'table', x: 90, y: 90, width: 130, height: 130, meta: { shape: 'round', capacity: 10, tableName: 'Table 1' } },
  { id: 't2', type: 'table', x: 640, y: 90, width: 130, height: 130, meta: { shape: 'round', capacity: 10, tableName: 'Table 2' } },
  { id: 't3', type: 'table', x: 90, y: 470, width: 130, height: 130, meta: { shape: 'round', capacity: 10, tableName: 'Table 3' } },
  { id: 't4', type: 'table', x: 640, y: 470, width: 130, height: 130, meta: { shape: 'round', capacity: 10, tableName: 'Table 4' } },
  { id: 't5', type: 'table', x: 300, y: 470, width: 130, height: 130, meta: { shape: 'round', capacity: 10, tableName: 'Table 5' } },
  { id: 't6', type: 'table', x: 470, y: 470, width: 130, height: 130, meta: { shape: 'round', capacity: 10, tableName: 'Table 6' } },
  // A long head table
  { id: 't7', type: 'table', x: 320, y: 340, width: 220, height: 70, rotation: 0, meta: { shape: 'rect', capacity: 12, tableName: 'Head Table' } },
];

const TABLES = FLOOR_ITEMS.filter((i) => i.type === 'table').map((t, i) => ({
  tableId: t.id,
  tableGuid: t.id,
  tableName: (t.meta as { tableName?: string }).tableName ?? `Table ${i + 1}`,
  maxSeats: (t.meta as { capacity?: number }).capacity ?? 10,
  capacity: (t.meta as { capacity?: number }).capacity ?? 10,
  assignedCount: [8, 10, 6, 9, 10, 7, 12][i] ?? 8,
  guests: [],
}));

function txn(id: number, name: string, amount: number, category: string, status: string, vendor: string, date: string) {
  return {
    transactionId: id,
    transactionGuid: `txn-${id}`,
    walletGuid: MOCK_WALLET_GUID,
    transactionName: name,
    amount,
    transactionDate: date,
    type: 1,
    category,
    remarks: JSON.stringify({
      _extended: { paymentStatus: status, vendorName: vendor, vendorContact: '', dueDate: null },
      notes: '',
    }),
  };
}

const TRANSACTIONS = [
  txn(1, 'Venue Deposit', 8000, 'Venue', 'Paid', 'Grand Ballroom', '2026-05-02'),
  txn(2, 'Wedding Photographer', 4500, 'Photography', 'Paid', 'Lumiere Studio', '2026-05-10'),
  txn(3, 'Floral Arrangements', 3200, 'Decoration', 'Overdue', 'Bloom & Co', '2026-05-18'),
  txn(4, 'Catering (per head)', 15600, 'Catering', 'Pending', 'Feast Catering', '2026-06-01'),
  txn(5, 'Live Band', 2800, 'Entertainment', 'Paid', 'The Nightingales', '2026-06-05'),
  txn(6, 'Wedding Cake', 950, 'Catering', 'Pending', 'Sweet Tier', '2026-06-12'),
  txn(7, 'Invitations & Stationery', 680, 'Invitation', 'Paid', 'Paper Lane', '2026-04-20'),
];

const GUESTS = [
  { guestId: 'g1', name: 'Emily & David Chen', phoneNo: '+60123456701', pax: 2, flag: 'Family', notes: 'Vegetarian', tableId: 't1', eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g2', name: 'Michael Tan', phoneNo: '+60123456702', pax: 1, flag: 'VIP', notes: '', tableId: 't1', eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g3', name: 'The Rodriguez Family', phoneNo: '+60123456703', pax: 4, flag: 'Family', notes: 'Highchair needed', tableId: 't2', eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g4', name: 'Aisha Rahman', phoneNo: '+60123456704', pax: 2, flag: 'Friends', notes: 'Halal', tableId: 't2', eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g5', name: 'James Wong', phoneNo: '+60123456705', pax: 1, flag: 'Colleague', notes: '', tableId: null, eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g6', name: 'Priya & Arjun Nair', phoneNo: '+60123456706', pax: 2, flag: 'Friends', notes: '', tableId: 't3', eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g7', name: 'Grandma Rose', phoneNo: '+60123456707', pax: 1, flag: 'Family', notes: 'Wheelchair access', tableId: null, eventGuid: MOCK_EVENT_GUID },
  { guestId: 'g8', name: 'Kenji Yamamoto', phoneNo: '+60123456708', pax: 2, flag: 'VIP', notes: '', tableId: 't3', eventGuid: MOCK_EVENT_GUID },
];

// ── Captures ────────────────────────────────────────────────────────────────

test('capture — RSVP designer v3', async ({ page }) => {
  await loginBranded(page);
  await hideHelpHint(page);
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/event\/GetEventByGuid\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: EVENT_WITH_SLUG } });
    }
    if (/\/event\//i.test(url) && method === 'GET' && !/\/event\/eventRsvp\//i.test(url)) {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: [EVENT_WITH_SLUG] } });
    }
    if (/\/RsvpDesign\/[^/]+\/design$/i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: RSVP_DESIGN } });
    }
    return route.fallback();
  });
  await page.goto('/app/rsvps/designer-v3');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/rsvp.png` });
});

test('capture — Floor plan', async ({ page }) => {
  await loginBranded(page);
  await hideHelpHint(page);
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/FloorPlan\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: { eventGuid: MOCK_EVENT_GUID, items: FLOOR_ITEMS } } });
    }
    if (/\/TableArrangement\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: { tables: TABLES } } });
    }
    if (/\/Guest\/ByEvent\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: GUESTS } });
    }
    return route.fallback();
  });
  await page.goto('/app/tables/floorplan');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/floorplan.png` });
});

test('capture — Wallet', async ({ page }) => {
  await loginBranded(page);
  await hideHelpHint(page);
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/Wallet\//i.test(url) && method === 'GET') {
      // useWalletsApi expects an ARRAY and maps backend `budget` → `totalBudget`.
      return route.fulfill({
        status: 200,
        json: { isSuccess: true, data: [{ ...MOCK_WALLET, budget: 50000, totalSpent: 35730, remainingBudget: 14270 }] },
      });
    }
    if (/\/Transaction\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: TRANSACTIONS } });
    }
    return route.fallback();
  });
  await page.goto('/app/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/wallet.png` });
});

test('capture — Guests', async ({ page }) => {
  await loginBranded(page);
  await hideHelpHint(page);
  await page.route('**/__mock_api__/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/Guest\/ByEvent\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: GUESTS } });
    }
    if (/\/TableArrangement\//i.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: { tables: TABLES } } });
    }
    return route.fallback();
  });
  await page.goto('/app/guests');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/guests.png` });
});
