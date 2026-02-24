// Test: Admin designer - login, select event, test question insert
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[CONSOLE ERROR]: ${msg.text()}`);
  });

  // ─── Step 1: Login ───────────────────────────────────────
  console.log('\n=== Step 1: Login ===');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);

  // Check page content
  const loginText = await page.textContent('body');
  console.log('Login page:', loginText?.substring(0, 200));

  // Try to find and fill login form
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');

  if (emailInput && passwordInput) {
    // First check if there are any placeholder hints
    const emailPh = await emailInput.getAttribute('placeholder');
    const passPh = await passwordInput.getAttribute('placeholder');
    console.log(`Email placeholder: ${emailPh}, Password placeholder: ${passPh}`);

    await emailInput.fill('test@test.com');
    await passwordInput.fill('Test@123');

    // Find submit button
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      const btnText = await submitBtn.textContent();
      console.log(`Submit button text: ${btnText}`);
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
  } else {
    console.log('No login form found');
    // Try checking all inputs
    const allInputs = await page.$$('input');
    for (const inp of allInputs) {
      const type = await inp.getAttribute('type');
      const name = await inp.getAttribute('name');
      const ph = await inp.getAttribute('placeholder');
      console.log(`Input: type=${type}, name=${name}, placeholder=${ph}`);
    }
  }

  // Check current URL after login
  const afterLoginUrl = page.url();
  console.log(`After login URL: ${afterLoginUrl}`);

  // Check if redirected to dashboard
  const currentText = await page.textContent('body');
  const isLoggedIn = currentText?.includes('Dashboard') || currentText?.includes('Events') || afterLoginUrl.includes('/app');
  console.log(`Logged in: ${isLoggedIn}`);

  if (!isLoggedIn) {
    console.log('Login failed. Page content:', currentText?.substring(0, 300));
    // Try to check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`Token in localStorage: ${token ? 'exists' : 'none'}`);
    await browser.close();
    return;
  }

  // ─── Step 2: Check events ──────────────────────────────────
  console.log('\n=== Step 2: Check events ===');
  await page.goto(`${BASE}/app/events`);
  await page.waitForTimeout(2000);

  // Check if we have events
  const eventCards = await page.$$('.cursor-pointer, [role="button"]');
  console.log(`Event cards/buttons found: ${eventCards.length}`);

  // Check localStorage for eventId
  const eventId = await page.evaluate(() => localStorage.getItem('eventId'));
  console.log(`eventId in localStorage: ${eventId}`);

  // If no event selected, try to select one
  if (!eventId) {
    // Look for an event select dropdown or button
    const selectDropdown = await page.$('select');
    if (selectDropdown) {
      const options = await selectDropdown.$$('option');
      if (options.length > 1) {
        const value = await options[1].getAttribute('value');
        console.log(`Selecting event: ${value}`);
        await selectDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
      }
    }
  }

  // ─── Step 3: Navigate to RSVP Designer ─────────────────────
  console.log('\n=== Step 3: RSVP Designer ===');
  await page.goto(`${BASE}/app/rsvps/designer`);
  await page.waitForTimeout(3000);

  // Check if "No Event" state
  const noEvent = await page.$('text=No Event');
  if (noEvent) {
    console.log('No event selected. Cannot test designer.');
    await browser.close();
    return;
  }

  // Check block list
  const blocks = await page.$$('[draggable="true"]');
  console.log(`Blocks in list: ${blocks.length}`);

  // Check Add block section
  const addBlockSection = await page.$('text=Add block');
  console.log(`"Add block" section found: ${!!addBlockSection}`);

  // Look for the question inserter
  const questionSection = await page.$('text=Insert RSVP question');
  console.log(`"Insert RSVP question" section found: ${!!questionSection}`);

  // Check the question select dropdown
  const questionSelects = await page.$$('select');
  console.log(`Select elements: ${questionSelects.length}`);
  for (const sel of questionSelects) {
    const options = await sel.$$('option');
    console.log(`  Options count: ${options.length}`);
    for (const opt of options) {
      const value = await opt.getAttribute('value');
      const text = await opt.textContent();
      console.log(`    value="${value}" text="${text}"`);
    }
  }

  // Check for the "question(s) available" text
  const summaryEl = await page.$('text=/question.*available/i');
  const noQuestionsEl = await page.$('text=/No RSVP questions/i');
  console.log(`Questions available text: ${!!summaryEl}`);
  console.log(`No questions text: ${!!noQuestionsEl}`);

  // Try to add an attendance block
  console.log('\n--- Trying to add Attendance block ---');
  const attendanceBtn = await page.$('button:has-text("Attendance")');
  if (attendanceBtn) {
    await attendanceBtn.click();
    await page.waitForTimeout(1000);
    const newBlocks = await page.$$('[draggable="true"]');
    console.log(`Blocks after adding attendance: ${newBlocks.length}`);
  } else {
    console.log('Attendance button not found');
  }

  // Try to add a Guest info block
  console.log('\n--- Trying to add Guest info block ---');
  const guestInfoBtn = await page.$('button:has-text("Guest info")');
  if (guestInfoBtn) {
    await guestInfoBtn.click();
    await page.waitForTimeout(1000);
    const newBlocks = await page.$$('[draggable="true"]');
    console.log(`Blocks after adding guest info: ${newBlocks.length}`);
  } else {
    console.log('Guest info button not found');
  }

  // Wait for user to see the result
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n=== TESTS COMPLETE ===');
}

run().catch(console.error);
