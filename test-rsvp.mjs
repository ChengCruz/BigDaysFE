// Quick Playwright test to debug RSVP issues
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // ─── Test 1: Login ───────────────────────────────────────────
  console.log('\n=== TEST 1: Login ===');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(1000);

  // Check if login page loads
  const loginForm = await page.$('form');
  if (!loginForm) {
    console.log('SKIP: No login form found, checking if already logged in');
    await page.goto(`${BASE}/app/rsvps/designer`);
    await page.waitForTimeout(2000);
  } else {
    // Try to fill login - adjust selectors as needed
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"]');
    if (emailInput && passwordInput) {
      await emailInput.fill('admin@test.com');
      await passwordInput.fill('password123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // ─── Test 2: Navigate to RSVP Designer ─────────────────────
  console.log('\n=== TEST 2: RSVP Designer ===');
  await page.goto(`${BASE}/app/rsvps/designer`);
  await page.waitForTimeout(3000);

  // Take snapshot of the page content
  const designerContent = await page.content();

  // Check for block list
  const blockCards = await page.$$('[draggable="true"]');
  console.log(`Found ${blockCards.length} draggable block cards in designer`);

  // Check for "Add block" section
  const addBlockBtns = await page.$$('button');
  const btnTexts = [];
  for (const btn of addBlockBtns) {
    const text = await btn.textContent();
    if (text && (text.includes('Attendance') || text.includes('Guest') || text.includes('Form field'))) {
      btnTexts.push(text.trim());
    }
  }
  console.log('Relevant add-block buttons found:', btnTexts);

  // Check for "Insert RSVP question" section
  const selectElements = await page.$$('select');
  console.log(`Found ${selectElements.length} <select> elements`);
  for (const sel of selectElements) {
    const options = await sel.$$('option');
    const optTexts = [];
    for (const opt of options) {
      optTexts.push(await opt.textContent());
    }
    console.log('Select options:', optTexts.slice(0, 5));
  }

  // Check if there's an event selected
  const noEventState = await page.$('text=No Event');
  if (noEventState) {
    console.log('WARNING: No event selected — designer shows "No Event" state');
    console.log('Need to set localStorage eventId first');

    // Try to find events
    await page.goto(`${BASE}/app/events`);
    await page.waitForTimeout(2000);
    const eventsContent = await page.textContent('body');
    console.log('Events page snippet:', eventsContent?.substring(0, 200));
  }

  // ─── Test 3: Check guest page with a test token ─────────────
  console.log('\n=== TEST 3: Guest Page ===');

  // First set a test design in localStorage
  const testToken = 'test-debug-token';
  const testDesign = JSON.stringify({
    eventTitle: 'Test Wedding',
    eventGuid: 'test-guid',
    blocks: [
      {
        id: 'h1',
        type: 'headline',
        title: 'Welcome to Our Wedding',
        subtitle: 'Please RSVP below',
        align: 'center',
        accent: 'text-white',
        background: { images: [], overlay: 0.4 }
      },
      {
        id: 'att1',
        type: 'attendance',
        title: 'Will you be attending?',
        subtitle: 'Please let us know',
        background: { images: [], overlay: 0.4 }
      },
      {
        id: 'gd1',
        type: 'guestDetails',
        title: 'Your Details',
        subtitle: 'Tell us about yourself',
        showFields: { name: true, email: true, phone: true, pax: true, guestType: true },
        background: { images: [], overlay: 0.4 }
      },
      {
        id: 'ff1',
        type: 'formField',
        label: 'Dietary Requirements',
        placeholder: 'Any dietary needs?',
        required: false,
        width: 'full',
        questionId: 'q-diet-001',
        background: { images: [], overlay: 0.4 }
      }
    ],
    flowPreset: 'serene',
    global: {
      backgroundColor: '#0f172a',
      backgroundType: 'color',
      backgroundAsset: '',
      overlay: 0.3,
      accentColor: '#f97316',
    },
    formFieldConfigs: [
      {
        questionId: 'q-diet-001',
        id: 'q-diet-001',
        label: 'Dietary Requirements',
        text: 'Dietary Requirements',
        typeKey: 'text',
        isRequired: false,
        options: undefined,
        order: 0,
      }
    ]
  });

  await page.evaluate((args) => {
    localStorage.setItem(`rsvp-share-${args.token}`, args.design);
  }, { token: testToken, design: testDesign });

  await page.goto(`${BASE}/rsvp/submit/${testToken}`);
  await page.waitForTimeout(3000);

  // Check what rendered
  const bodyText = await page.textContent('body');
  console.log('\nGuest page body text (first 1000 chars):');
  console.log(bodyText?.substring(0, 1000));

  // Check for specific elements
  const sections = await page.$$('section');
  console.log(`\nFound ${sections.length} <section> elements`);

  for (let i = 0; i < sections.length; i++) {
    const text = await sections[i].textContent();
    console.log(`Section ${i}: "${text?.substring(0, 100)}"`);
  }

  // Check for attendance buttons
  const attendanceBtns = await page.$$('button');
  const attendanceTexts = [];
  for (const btn of attendanceBtns) {
    const text = await btn.textContent();
    if (text && (text.includes("Yes") || text.includes("No") || text.includes("Maybe"))) {
      attendanceTexts.push(text.trim());
    }
  }
  console.log('\nAttendance buttons found:', attendanceTexts);

  // Check for form inputs
  const inputs = await page.$$('input');
  console.log(`\nFound ${inputs.length} <input> elements`);
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const label = await input.evaluate(el => {
      const label = el.closest('.space-y-1')?.querySelector('label');
      return label?.textContent ?? '';
    });
    console.log(`  Input: type=${type}, placeholder="${placeholder}", label="${label}"`);
  }

  // Check for "Invalid or expired" error
  const errorText = await page.$('text=Invalid or expired');
  if (errorText) {
    console.log('\nERROR: Got "Invalid or expired link" page');
  }

  // Check if navbar/footer exists (should NOT be present)
  const navbar = await page.$('nav');
  console.log(`\nNavbar present: ${!!navbar} (should be false for standalone page)`);

  // Take screenshot
  await page.screenshot({ path: '/c/MyBigDays/my-big-day/test-guest-page.png', fullPage: true });
  console.log('\nScreenshot saved to test-guest-page.png');

  await browser.close();
  console.log('\n=== TESTS COMPLETE ===');
}

run().catch(console.error);
