// Test the admin designer flow - specifically the question insert and link
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[CONSOLE ERROR]: ${msg.text()}`);
  });
  page.on('pageerror', err => console.log(`[PAGE ERROR]: ${err.message}`));

  // ─── Test: Simulate what happens when design goes through mapper ─────
  console.log('\n=== TEST: Mapper round-trip with GUID questionId ===');

  // Evaluate the mapper functions in the browser context
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(2000);

  const mapperResult = await page.evaluate(async () => {
    // Dynamically import the mapper
    // Since this is a Vite app, we can access modules through import()
    try {
      const { mapToBackendPayload, mapToFrontendDesign } = await import('/src/utils/rsvpDesignMapper.ts');

      // Create a test design with a GUID questionId
      const testDesign = {
        blocks: [
          {
            id: 'test-headline',
            type: 'headline',
            title: 'Test',
            subtitle: 'Sub',
            align: 'center',
            accent: 'text-white',
            background: { images: [], overlay: 0.4 }
          },
          {
            id: 'test-form',
            type: 'formField',
            label: 'Dietary Needs',
            placeholder: 'Enter here',
            required: true,
            width: 'full',
            hint: 'text',
            questionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // GUID
            background: { images: [], overlay: 0.4 }
          },
          {
            id: 'test-attendance',
            type: 'attendance',
            title: 'Will you attend?',
            subtitle: 'Let us know',
            background: { images: [], overlay: 0.4 }
          },
          {
            id: 'test-guest-details',
            type: 'guestDetails',
            title: 'Your Info',
            subtitle: 'Details please',
            showFields: { name: true, email: true, phone: false, pax: true, guestType: false },
            background: { images: [], overlay: 0.4 }
          }
        ],
        flowPreset: 'serene',
        globalBackgroundType: 'color',
        globalBackgroundAsset: '',
        globalBackgroundColor: '#0f172a',
        globalOverlay: 0.3,
        accentColor: '#f97316',
        formFieldConfigs: [
          { questionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', label: 'Dietary Needs', typeKey: 'text' }
        ]
      };

      // Step 1: Convert to backend payload
      const backendPayload = mapToBackendPayload(testDesign, 'event-123');

      // Find the formField block in backend format
      const backendFormBlock = backendPayload.design.blocks.find(b => b.type === 'formField');
      const backendAttendanceBlock = backendPayload.design.blocks.find(b => b.type === 'attendance');
      const backendGuestDetailsBlock = backendPayload.design.blocks.find(b => b.type === 'guestDetails');

      // Step 2: Simulate API response (wrap in the structure mapToFrontendDesign expects)
      const apiResponse = {
        version: 1,
        eventGuid: 'event-123',
        shareToken: 'test-token',
        design: backendPayload.design,
        isPublished: false,
        isDraft: true,
      };

      // Step 3: Convert back to frontend
      const frontendDesign = mapToFrontendDesign(apiResponse);

      // Find blocks in frontend format
      const frontendFormBlock = frontendDesign.blocks?.find(b => b.type === 'formField');
      const frontendAttendanceBlock = frontendDesign.blocks?.find(b => b.type === 'attendance');
      const frontendGuestDetailsBlock = frontendDesign.blocks?.find(b => b.type === 'guestDetails');

      return {
        backend: {
          formBlock: backendFormBlock ? {
            type: backendFormBlock.type,
            formFieldId: backendFormBlock.formFieldId,
            questionId: backendFormBlock.questionId,
            label: backendFormBlock.label,
          } : null,
          attendanceBlock: backendAttendanceBlock ? {
            type: backendAttendanceBlock.type,
            title: backendAttendanceBlock.title,
          } : null,
          guestDetailsBlock: backendGuestDetailsBlock ? {
            type: backendGuestDetailsBlock.type,
            title: backendGuestDetailsBlock.title,
            showFields: backendGuestDetailsBlock.showFields,
          } : null,
          formFieldConfigs: backendPayload.design.formFieldConfigs,
        },
        frontend: {
          formBlock: frontendFormBlock ?? null,
          attendanceBlock: frontendAttendanceBlock ?? null,
          guestDetailsBlock: frontendGuestDetailsBlock ?? null,
          formFieldConfigs: frontendDesign.formFieldConfigs,
          blockTypes: frontendDesign.blocks?.map(b => b.type),
        }
      };
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  });

  console.log('\nMapper round-trip results:');
  console.log(JSON.stringify(mapperResult, null, 2));

  // ─── Test: Guest page with round-tripped data ──────────────────────
  console.log('\n=== TEST: Guest page with round-tripped design ===');

  // Use the round-tripped data to create a localStorage snapshot
  if (!mapperResult.error && mapperResult.frontend.formBlock) {
    const roundTrippedDesign = JSON.stringify({
      eventTitle: 'Test Wedding',
      eventGuid: 'event-123',
      blocks: [
        {
          id: 'h1', type: 'headline', title: 'Welcome', subtitle: 'RSVP below',
          align: 'center', accent: 'text-white', background: { images: [], overlay: 0.4 }
        },
        mapperResult.frontend.attendanceBlock,
        mapperResult.frontend.guestDetailsBlock,
        mapperResult.frontend.formBlock,
      ].filter(Boolean),
      flowPreset: 'serene',
      global: {
        backgroundColor: '#0f172a', backgroundType: 'color', backgroundAsset: '',
        overlay: 0.3, accentColor: '#f97316',
      },
      formFieldConfigs: mapperResult.frontend.formFieldConfigs ?? mapperResult.backend.formFieldConfigs,
    });

    await page.evaluate((args) => {
      localStorage.setItem(`rsvp-share-${args.token}`, args.design);
    }, { token: 'round-trip-test', design: roundTrippedDesign });

    await page.goto(`${BASE}/rsvp/submit/round-trip-test`);
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    console.log('Guest page content after round-trip:');
    console.log(bodyText?.substring(0, 800));

    const sections = await page.$$('section');
    console.log(`\nSections found: ${sections.length}`);
    for (let i = 0; i < sections.length; i++) {
      const text = await sections[i].textContent();
      console.log(`  Section ${i}: "${text?.substring(0, 80)}"`);
    }

    const inputs = await page.$$('input');
    console.log(`Inputs found: ${inputs.length}`);
  }

  await browser.close();
  console.log('\n=== TESTS COMPLETE ===');
}

run().catch(console.error);
