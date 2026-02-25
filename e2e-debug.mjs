/**
 * Debug Playwright script — no Playwright MCP needed, run directly via Node.
 * Tests: (1) guest submit flow, (2) admin designer question linking.
 *
 * Run: node e2e-debug.mjs
 * Requires: `npx playwright install chromium` already done.
 */
import { chromium } from "playwright";
import { createServer } from "http";

// ─── Minimal mock API server ──────────────────────────────────────────────────
const EVENT_GUID = "11111111-1111-1111-1111-111111111111";
const QUESTION_ID_INT = 42; // integer from backend
const SHARE_TOKEN = "debugtoken123";

const MOCK_DESIGN = {
  rsvpDesignId: 1,
  eventGuid: EVENT_GUID,
  version: 1,
  isPublished: true,
  isDraft: false,
  shareToken: SHARE_TOKEN,
  design: {
    theme: {
      accentColor: "#f97316",
      background: { type: "color", color: "#0f172a", assetUrl: "" },
      overlayOpacity: 0.3,
    },
    layout: { width: 1200, maxHeight: 0 },
    previewModes: ["mobile"],
    flowPreset: "serene",
    blocks: [
      { id: "b1", type: "attendance", title: "Will you attend?", subtitle: "" },
      {
        id: "b2",
        type: "guestDetails",
        title: "Your details",
        showFields: { name: true, email: true, phone: true, pax: true, guestType: true },
      },
      {
        id: "b3",
        type: "formField",
        label: "Dietary requirement",
        placeholder: "Any allergies?",
        required: false,
        width: 100,
        questionId: String(QUESTION_ID_INT), // string from our fix
      },
    ],
  },
};

const MOCK_QUESTIONS = [
  {
    questionId: QUESTION_ID_INT, // integer from API
    eventGuid: EVENT_GUID,
    text: "Dietary requirement",
    isRequired: false,
    type: 0, // text
    options: null,
    order: 1,
    isActive: true,
  },
];

function mockApiServer() {
  return createServer((req, res) => {
    const url = req.url || "";
    console.log(`  [MockAPI] ${req.method} ${url}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", req.headers["origin"] || "*");
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

    // Design by eventGuid
    if (url.includes(`/RsvpDesign/${EVENT_GUID}/design`) && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ isSuccess: true, data: MOCK_DESIGN }));
      return;
    }
    // Questions
    if (url.includes(`/question/GetQuestions/${EVENT_GUID}`) || url.includes(`/Question/GetQuestions/${EVENT_GUID}`)) {
      res.writeHead(200);
      res.end(JSON.stringify({ isSuccess: true, data: MOCK_QUESTIONS }));
      return;
    }
    // RSVP create
    if (url.includes("/rsvp/Create") || url.includes("/Rsvp/Create")) {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        console.log("  [MockAPI] RSVP Create body:", body);
        res.writeHead(200);
        res.end(JSON.stringify({ isSuccess: true, message: "RSVP created" }));
      });
      return;
    }
    // Public design by token — intentionally 404 to force eventGuid fallback
    if (url.includes("/RsvpDesign/public/")) {
      res.writeHead(404);
      res.end(JSON.stringify({ isSuccess: false, message: "Not found" }));
      return;
    }
    // Login (not needed for public page)
    if (url.includes("/User/Login")) {
      res.writeHead(200);
      res.end(JSON.stringify({ isSuccess: true, data: { token: "mock-token", user: { id: "u1", name: "Admin" } } }));
      return;
    }
    // Design endpoints for admin
    if (url.includes(`/RsvpDesign/${EVENT_GUID}`) && req.method === "POST") {
      res.writeHead(200);
      res.end(JSON.stringify({ isSuccess: true, data: { ...MOCK_DESIGN, version: 2 } }));
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: `Unhandled: ${req.method} ${url}` }));
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────
const RESULTS = [];
function pass(name) { console.log(`  ✅ PASS: ${name}`); RESULTS.push({ name, pass: true }); }
function fail(name, reason) { console.error(`  ❌ FAIL: ${name} — ${reason}`); RESULTS.push({ name, pass: false, reason }); }

async function testGuestSubmit(page, baseUrl) {
  console.log("\n── Test: Guest submit flow ──────────────────────────────────────");
  const url = `${baseUrl}/rsvp/submit/${SHARE_TOKEN}?event=${EVENT_GUID}`;
  console.log("  Opening:", url);

  const apiCalls = [];
  page.on("request", req => {
    if (req.url().includes("4999")) apiCalls.push({ method: req.method(), url: req.url() });
  });
  const apiResponses = [];
  page.on("response", res => {
    if (res.url().includes("4999")) apiResponses.push({ status: res.status(), url: res.url() });
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });

  // 1. Check design loaded (not "Invalid or expired link")
  const invalidMsg = await page.locator("text=Invalid or expired link").isVisible().catch(() => false);
  if (invalidMsg) {
    fail("Design loads for external user", "Showed 'Invalid or expired link'");
    console.log("  API calls made:", apiCalls.map(c => `${c.method} ${c.url}`));
    return;
  }
  pass("Design loads for external user (no 'Invalid or expired' screen)");

  // 2. Check attendance block rendered
  const yesBtn = page.locator("button", { hasText: /yes/i }).first();
  const yesBtnVisible = await yesBtn.isVisible().catch(() => false);
  if (!yesBtnVisible) { fail("Attendance Yes/No buttons visible", "Not found"); return; }
  pass("Attendance block rendered");

  // 3. Fill the form
  await yesBtn.click();
  await page.fill('input[placeholder="Full name"]', "Test Guest").catch(() =>
    page.locator('input[type="text"]').first().fill("Test Guest")
  );
  await page.fill('input[type="email"]', "guest@test.com").catch(() => {});
  await page.fill('input[placeholder="+60 12-345 6789"]', "+60123456789").catch(() =>
    page.locator('input[type="text"]').nth(1).fill("+60123456789").catch(() => {})
  );

  // 4. Check formField block rendered (custom question)
  const formFieldLabel = await page.locator("text=Dietary requirement").isVisible().catch(() => false);
  if (!formFieldLabel) {
    fail("Custom formField block rendered", "Label 'Dietary requirement' not visible");
  } else {
    pass("Custom formField block rendered with correct label");
    // Fill it
    await page.locator('input[placeholder="Any allergies?"]').fill("None").catch(() => {});
  }

  // 5. Submit
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  // Wait for success screen or error
  await page.waitForTimeout(3000);
  const successVisible = await page.locator("text=RSVP Submitted").isVisible().catch(() => false)
    || await page.locator("text=Thank").isVisible().catch(() => false)
    || await page.locator("text=Success").isVisible().catch(() => false);

  const toastError = await page.locator("text=Failed to submit").isVisible().catch(() => false);

  if (successVisible) {
    pass("Form submits successfully → success screen shown");
  } else if (toastError) {
    fail("Form submit", "Toast error appeared — submit failed");
    // Find what API call was made
    const submitCall = apiCalls.find(c => c.url.includes("Create") || c.url.includes("public"));
    console.log("  Submit API call:", submitCall);
    const submitResp = apiResponses.find(r => r.url.includes("Create") || r.url.includes("public"));
    console.log("  Submit API response:", submitResp);
  } else {
    fail("Form submit", "Neither success screen nor error toast — check console");
  }

  // Report all API calls
  console.log("  All API calls:", apiCalls.map(c => `${c.method} ${c.url}`).join("\n    "));
}

async function testQuestionLinking(page, baseUrl) {
  console.log("\n── Test: Designer question linking ──────────────────────────────");

  // First inject a mock token and localStorage entry to simulate logged-in admin
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate((eventGuid) => {
    localStorage.setItem("token", "mock-admin-token");
    localStorage.setItem("eventId", eventGuid);
  }, EVENT_GUID);

  // Intercept the useFormFields call
  const apiCalls = [];
  page.on("request", req => {
    if (req.url().includes("4999")) apiCalls.push({ method: req.method(), url: req.url() });
  });

  await page.goto(`${baseUrl}/app/rsvps/designer`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);

  // Check if questions loaded in designer
  const questionsCalled = apiCalls.some(c => c.url.includes("GetQuestions") || c.url.includes("getQuestions"));
  if (!questionsCalled) {
    fail("useFormFields called", "No GetQuestions API call made");
  } else {
    pass("useFormFields API called");
  }

  // Try to find the block editor and formField block
  // First add a formField block if none exists
  const addBlockBtn = page.locator("button", { hasText: /add block|form field/i }).first();
  if (await addBlockBtn.isVisible().catch(() => false)) {
    await addBlockBtn.click();
    await page.waitForTimeout(500);
  }

  // Look for the question selector dropdown
  const questionSelect = page.locator("select").filter({ hasText: /choose a question/i }).first();
  const hasQuestionDropdown = await questionSelect.isVisible().catch(() => false);
  if (!hasQuestionDropdown) {
    fail("Question dropdown visible in BlockEditor", "Select with 'Choose a question' not found");
    // Check what's on screen
    const selects = await page.locator("select").count();
    console.log("  Selects on page:", selects);
    return;
  }
  pass("Question dropdown present in BlockEditor");

  // Check dropdown options
  const options = await questionSelect.locator("option").all();
  const optionTexts = await Promise.all(options.map(o => o.textContent()));
  console.log("  Dropdown options:", optionTexts);

  const hasQuestion = optionTexts.some(t => t?.includes("Dietary") || t?.includes("42"));
  if (!hasQuestion) {
    fail("Question appears in dropdown", `Options: ${optionTexts.join(", ")}`);
    return;
  }
  pass("Question 'Dietary requirement' in dropdown");

  // Select it
  await questionSelect.selectOption({ index: 1 });
  await page.waitForTimeout(500);

  // Check that the block's questionId was updated (look for the green "Linked" indicator)
  const linkedIndicator = await page.locator("text=Linked").isVisible().catch(() => false);
  if (linkedIndicator) {
    pass("Question linked — 'Linked' indicator shown");
  } else {
    fail("Question linking", "'✓ Linked' indicator not shown after selecting question");
    // Dump block state
    console.log("  Select value after change:", await questionSelect.inputValue().catch(() => "unknown"));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const server = mockApiServer();
  await new Promise(r => server.listen(4999, r));
  console.log("Mock API listening on :4999");

  // Start vite dev server
  const { spawn } = await import("child_process");
  const vite = spawn("npx", ["vite", "--mode", "test", "--port", "5199"], {
    cwd: process.cwd(),
    env: { ...process.env, VITE_API_BASE: "http://localhost:4999/api/v1", VITE_API_KEY: "test", VITE_API_AUTHOR: "test" },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let viteReady = false;
  vite.stdout.on("data", d => {
    const s = d.toString();
    process.stdout.write(`  [Vite] ${s}`);
    if (s.includes("Local:") || s.includes("localhost:5199") || s.includes("ready in")) viteReady = true;
  });
  vite.stderr.on("data", d => {
    const s = d.toString();
    process.stderr.write(`  [ViteErr] ${s}`);
    if (s.includes("Local:") || s.includes("localhost:5199") || s.includes("ready in")) viteReady = true;
  });

  console.log("Waiting for Vite dev server...");
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Vite timeout")), 60000);
    const check = setInterval(() => { if (viteReady) { clearInterval(check); clearTimeout(t); resolve(); } }, 500);
  });
  const baseUrl = "http://localhost:5199";
  console.log("Vite ready at", baseUrl);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Capture console errors
  page.on("console", msg => {
    if (msg.type() === "error") console.error(`  [BrowserError] ${msg.text()}`);
  });
  page.on("pageerror", err => console.error(`  [PageError] ${err.message}`));

  try {
    await testGuestSubmit(page, baseUrl);
    await testQuestionLinking(page, baseUrl);
  } finally {
    await browser.close();
    vite.kill();
    server.close();
  }

  console.log("\n─── Summary ────────────────────────────────────────────────────────");
  RESULTS.forEach(r => console.log(r.pass ? `  ✅ ${r.name}` : `  ❌ ${r.name}: ${r.reason}`));
  const failed = RESULTS.filter(r => !r.pass);
  process.exit(failed.length > 0 ? 1 : 0);
})();
