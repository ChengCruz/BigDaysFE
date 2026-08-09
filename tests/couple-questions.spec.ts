/**
 * Couple-mode "What to ask" (CoupleQuestionsPage) + the FormFieldsRoute split.
 *
 * Three things are under test, and each one guards a specific mistake:
 *
 * 1. ROUTE SPLIT: /app/form-fields must render the couple body in couple mode
 *    and the planner body in planner mode, from the SAME url. If someone forks
 *    this into /app/couple/form-fields, the step-1 card and the sidebar diverge.
 *
 * 2. THE STEP-1 LINK: CoupleGuestsPage must navigate to /app/form-fields, not
 *    /app/events/:id/form-fields. Both render the same page (the :id segment is
 *    decorative), but only the former matches the Guests section in
 *    coupleSections.ts; the latter matches /app/events and lights up Home.
 *
 * 3. THE ENVELOPE: the backend returns HTTP *200* with `statusCode: 422`
 *    inside the body when you edit a question that already has answers
 *    (QuestionService.UpdateQuestion). Nothing in client.ts converts that into
 *    a rejection, so react-query reports success. If the page trusts the
 *    promise it will close the modal on a save that never happened. There is no
 *    `hasExistingAnswers` field on the backend to predict this with, so the
 *    envelope is the only signal, which is why it is tested at all.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, mockApi, MOCK_EVENT_GUID } from './helpers';

/** Force couple mode before the app boots; UiModeContext reads it once, at mount. */
async function forceCoupleMode(page: Page) {
  await page.addInitScript(() => localStorage.setItem('uiMode', 'couple'));
}

const QUESTIONS = [
  {
    questionId: 1,
    eventGuid: MOCK_EVENT_GUID,
    text: 'What would you like to eat?',
    type: 2, // select
    options: '["Chicken","Fish"]',
    order: 1,
    isRequired: true,
    isActive: true,
  },
  {
    questionId: 2,
    eventGuid: MOCK_EVENT_GUID,
    text: 'Any song requests?',
    type: 1, // textarea
    options: '',
    order: 2,
    isRequired: false,
    isActive: true,
  },
  {
    questionId: 3,
    eventGuid: MOCK_EVENT_GUID,
    text: 'Do you need a room?',
    type: 0, // text
    options: '',
    order: 3,
    isRequired: false,
    isActive: false, // hidden from the invite
  },
];

/**
 * Serve a question list, and optionally hand back a specific envelope for
 * /question/Update so the 200-with-422-inside path can be exercised.
 */
async function mockQuestions(
  page: Page,
  opts: { questions?: unknown[]; updateEnvelope?: Record<string, unknown> } = {}
) {
  const { questions = QUESTIONS, updateEnvelope } = opts;
  // Registered after mockApi so it runs first (last-registered-first).
  await page.route('**/__mock_api__/**', async (route) => {
    const url = route.request().url();
    if (/\/question\/GetQuestions\//i.test(url)) {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: questions } });
    }
    if (updateEnvelope && /\/question\/Update/i.test(url)) {
      // Deliberately HTTP 200: the failure lives in the body, as the BE does it.
      return route.fulfill({ status: 200, json: updateEnvelope });
    }
    return route.fallback();
  });
}

async function gotoCoupleQuestions(page: Page, opts?: Parameters<typeof mockQuestions>[1]) {
  await forceCoupleMode(page);
  await gotoAuthenticated(page, '/app/form-fields');
  await mockQuestions(page, opts);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('The route renders a different body per mode, from one url', () => {
  test('couple mode gets the couple page', async ({ page }) => {
    await gotoCoupleQuestions(page);
    await expect(page.getByRole('heading', { name: 'What to ask' })).toBeVisible();
    // The planner heading must be gone, not merely restyled.
    await expect(page.locator('text=Custom RSVP Fields')).toBeHidden();
  });

  test('planner mode still gets the planner page at the same url', async ({ page }) => {
    // No uiMode override; gotoAuthenticated signs in as Admin (role 2, planner).
    await gotoAuthenticated(page, '/app/form-fields');
    await mockQuestions(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Custom RSVP Fields')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What to ask' })).toHaveCount(0);
  });

  test('the legacy /app/events/:id/form-fields url also honours the mode', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticated(page, `/app/events/${MOCK_EVENT_GUID}/form-fields`);
    await mockQuestions(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'What to ask' })).toBeVisible();
  });
});

test.describe('Step 1 on the guest list points at the section-matching url', () => {
  test('navigates to /app/form-fields, never /app/events/:id/form-fields', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticated(page, '/app/guests');
    await mockQuestions(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('text=What to ask');

    await expect(page).toHaveURL(/\/app\/form-fields$/);
    // The url that would light up Home instead of Guests.
    await expect(page).not.toHaveURL(/\/app\/events\//);
  });

  test('the steps read questions → design → replies, in that order', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticated(page, '/app/guests');
    await page.waitForLoadState('networkidle');

    // Order matters: the designer inserts questions as blocks, so they must
    // exist first. Assert on position, not just presence.
    const steps = page.locator('text=/^Step [123]$/');
    await expect(steps).toHaveCount(3);
    await expect(page.locator('text=What to ask')).toBeVisible();

    const askBox = await page.locator('text=What to ask').boundingBox();
    const designBox = await page.locator('text=Design invite ↗').boundingBox();
    expect(askBox!.x).toBeLessThan(designBox!.x);
  });

  test('step 1 says so when no questions exist yet', async ({ page }) => {
    await forceCoupleMode(page);
    await gotoAuthenticated(page, '/app/guests');
    await page.waitForLoadState('networkidle');
    // The catch-all mock returns data: [], so eventRsvpInternal yields no questions.
    await expect(page.locator('text=Not set up yet')).toBeVisible();
  });
});

test.describe('The list speaks to a couple, not to a form builder', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCoupleQuestions(page);
  });

  test('shows each question with a plain-language answer type', async ({ page }) => {
    await expect(page.locator('text=What would you like to eat?')).toBeVisible();
    // "Pick one from a list", not "Dropdown"/"select".
    await expect(page.locator('text=Pick one from a list')).toBeVisible();
    await expect(page.locator('text=Long answer')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Short Text');
  });

  test('marks a required question as one a guest must answer', async ({ page }) => {
    await expect(page.locator('text=Must answer')).toBeVisible();
  });

  test('marks a deactivated question as hidden rather than deleted', async ({ page }) => {
    await expect(page.locator('text=Hidden from invite')).toBeVisible();
  });

  test('offers a way back to the guest list', async ({ page }) => {
    await page.click('text=← Back to guests');
    await expect(page).toHaveURL(/\/app\/guests$/);
  });
});

/**
 * Its own describe: gotoCoupleQuestions signs in, and a second sign-in on an
 * already-authenticated page never reaches the login form.
 */
test.describe('With no questions yet', () => {
  test('empty state invites a first question instead of showing a bare list', async ({ page }) => {
    await gotoCoupleQuestions(page, { questions: [] });
    await expect(page.locator('text=No questions yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add a question' }).first()).toBeVisible();
  });
});

test.describe('Hiding is offered as the reversible option, deleting as the final one', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCoupleQuestions(page);
  });

  test('hiding warns that answers are kept', async ({ page }) => {
    await page.click('[aria-label="Hide Any song requests? from the invite"]');
    await expect(page.locator('text=Answers guests already gave are kept')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide it' })).toBeVisible();
  });

  test('deleting warns it cannot be undone and points at hiding', async ({ page }) => {
    await page.click('[aria-label="Delete Any song requests?"]');
    await expect(page.locator('text=This cannot be undone')).toBeVisible();
    await expect(page.locator('text=hide it instead')).toBeVisible();
  });

  test('a hidden question offers to be shown again, not hidden again', async ({ page }) => {
    await expect(
      page.locator('[aria-label="Show Do you need a room? on the invite"]')
    ).toBeVisible();
  });
});

test.describe('The backend contract is honoured exactly', () => {
  test('update sends every field plus eventGuid, since the BE update is a full replace', async ({
    page,
  }) => {
    await gotoCoupleQuestions(page);

    const updateBody = new Promise<Record<string, unknown>>((resolve) => {
      page.on('request', (req) => {
        if (/\/question\/Update/i.test(req.url()) && req.method() === 'POST') {
          resolve(JSON.parse(req.postData() || '{}'));
        }
      });
    });

    await page.click('[aria-label="Edit Any song requests?"]');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    const body = await updateBody;
    // AssignEventsParam assigns all six unconditionally; a missing key is a wipe.
    for (const key of ['text', 'type', 'options', 'order', 'isRequired']) {
      expect(body).toHaveProperty(key);
    }
    // The ownership predicate on the update path: WHERE QuestionId AND EventGuid.
    expect(body.eventGuid).toBe(MOCK_EVENT_GUID);
    expect(String(body.questionId)).toBe('2');
  });

  test('a 200 carrying statusCode 422 is surfaced, not swallowed', async ({ page }) => {
    await gotoCoupleQuestions(page, {
      updateEnvelope: {
        isSuccess: false,
        statusCode: 422,
        message: 'Update fail because question has more than one answer submitted.',
        data: false,
      },
    });

    await page.click('[aria-label="Edit Any song requests?"]');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    // The BE's own message, shown to the couple. Trusting the resolved promise
    // would close the modal and silently report success here.
    await expect(page.getByRole('alert')).toContainText('has more than one answer submitted');
  });

  test('a genuine success shows no error banner', async ({ page }) => {
    await gotoCoupleQuestions(page, {
      updateEnvelope: { isSuccess: true, statusCode: 200, message: 'Updated.', data: true },
    });

    await page.click('[aria-label="Edit Any song requests?"]');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('Planner mode is untouched', () => {
  test('planner keeps its own field types and actions', async ({ page }) => {
    await mockApi(page);
    await gotoAuthenticated(page, '/app/form-fields');
    await mockQuestions(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Custom RSVP Fields')).toBeVisible();
    await expect(page.locator('text=+ New Field')).toBeVisible();
    await expect(page.locator('text=Dropdown')).toBeVisible();
  });
});
