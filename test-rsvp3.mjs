// Test: Simulate OLD backend data (before fix) where questionId was lost
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[CONSOLE ERROR]: ${msg.text()}`);
  });

  await page.goto(`${BASE}/`);
  await page.waitForTimeout(2000);

  // Test: Old backend response (no questionId on ApiBlock, formFieldId=NaN was dropped)
  console.log('\n=== TEST: Old backend data (questionId lost) ===');
  const result = await page.evaluate(async () => {
    const { mapToFrontendDesign } = await import('/src/utils/rsvpDesignMapper.ts');

    // This simulates what the OLD backend stored (before questionId fix):
    // - formFieldId was NaN (because parseInt on GUID), so it was undefined
    // - questionId was NOT stored (old ApiBlock didn't have it)
    const oldApiResponse = {
      version: 1,
      eventGuid: 'event-123',
      shareToken: 'old-token',
      design: {
        theme: {
          accentColor: '#f97316',
          background: { type: 'color', color: '#0f172a', assetUrl: '' },
          overlayOpacity: 0.3,
        },
        layout: { width: 1200, maxHeight: 0 },
        previewModes: ['mobile', 'desktop'],
        flowPreset: 'serene',
        blocks: [
          {
            id: 'h1', type: 'headline', title: 'Welcome', subtitle: 'Sub',
            align: 'center', accentClass: 'text-white', accentColor: '#f97316',
          },
          {
            id: 'ff1', type: 'formField', label: 'Dietary Needs',
            placeholder: 'Enter', required: true, width: 100,
            hint: 'text',
            // OLD data: formFieldId is undefined (NaN was stripped)
            // questionId is undefined (wasn't saved)
          },
        ],
        // OLD data: no formFieldConfigs
      },
      isPublished: false,
      isDraft: true,
    };

    const frontend = mapToFrontendDesign(oldApiResponse);
    const formBlock = frontend.blocks?.find(b => b.type === 'formField');

    return {
      blockTypes: frontend.blocks?.map(b => b.type),
      formBlock: formBlock ?? 'NOT FOUND',
      formFieldConfigs: frontend.formFieldConfigs ?? 'UNDEFINED',
    };
  });

  console.log('Old backend data result:');
  console.log(JSON.stringify(result, null, 2));

  // Test with old localStorage snapshot (no attendance/guestDetails blocks, no formFieldConfigs)
  console.log('\n=== TEST: Old localStorage snapshot ===');
  const oldSnap = JSON.stringify({
    eventTitle: 'Old Wedding',
    eventGuid: 'event-old',
    blocks: [
      {
        id: 'h1', type: 'headline', title: 'Welcome to our wedding',
        subtitle: 'Save the date', align: 'center', accent: 'text-white',
        background: { images: [], overlay: 0.4 }
      },
      {
        id: 'ff1', type: 'formField', label: 'Dietary Needs',
        placeholder: 'Enter', required: true, width: 'full',
        questionId: 'some-guid-123',
        background: { images: [], overlay: 0.4 }
      },
    ],
    flowPreset: 'serene',
    global: {
      backgroundColor: '#0f172a', backgroundType: 'color', backgroundAsset: '',
      overlay: 0.3, accentColor: '#f97316',
    },
    // NO formFieldConfigs in old snapshot
  });

  await page.evaluate((args) => {
    localStorage.setItem(`rsvp-share-${args.token}`, args.snap);
  }, { token: 'old-snap-test', snap: oldSnap });

  await page.goto(`${BASE}/rsvp/submit/old-snap-test`);
  await page.waitForTimeout(3000);

  const bodyText = await page.textContent('body');
  console.log('Old snapshot guest page:');
  console.log(bodyText?.substring(0, 800));

  const sections = await page.$$('section');
  console.log(`Sections: ${sections.length}`);
  for (let i = 0; i < sections.length; i++) {
    const text = await sections[i].textContent();
    console.log(`  Section ${i}: "${text?.substring(0, 100)}"`);
  }

  const inputs = await page.$$('input');
  console.log(`Inputs: ${inputs.length}`);
  for (const input of inputs) {
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  placeholder="${placeholder}"`);
  }

  await browser.close();
  console.log('\n=== TESTS COMPLETE ===');
}

run().catch(console.error);
