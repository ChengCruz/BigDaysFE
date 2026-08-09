/**
 * Planner-mode question builder (FormFieldsPage): the envelope contract.
 *
 * The question endpoints do not report every refusal as a 4xx. POST
 * /question/Update answers HTTP *200* with `statusCode: 422` inside the body when
 * the question already has answers (QuestionService.UpdateQuestion), and the
 * Activate/Deactivate/Delete toggles do the same when the save writes no rows.
 * Nothing in client.ts converts that into a rejection, so axios resolves and
 * react-query calls it a success.
 *
 * The page used to call mutate() and close the modal on that resolved promise,
 * which reported a save the backend had refused. Couple mode already guarded this
 * (see couple-questions.spec.ts); these tests hold the planner body to the same
 * contract, plus the identifiers each write has to carry.
 *
 * On identifiers: `eventGuid` on create/update and `eventId` on the toggles are
 * two names for the SAME value: an event GUID. QuestionToggleRequest.EventId is
 * a string that QuestionService feeds to IdsValidatorHelper.GetEventGuid, so a
 * numeric event id there is a 400. Only `questionId` is an integer (the identity
 * PK), and it travels as a string.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, MOCK_EVENT_GUID } from './helpers';

const QUESTIONS = [
  {
    questionId: 7,
    eventGuid: MOCK_EVENT_GUID,
    text: 'Any song requests?',
    type: 1, // textarea
    options: '',
    order: 1,
    isRequired: false,
    isActive: true,
  },
];

type Envelopes = {
  update?: Record<string, unknown>;
  delete?: Record<string, unknown>;
  deactivate?: Record<string, unknown>;
};

/**
 * Serve the question list and, per endpoint, hand back a specific envelope so the
 * 200-with-the-refusal-inside path can be exercised. Registered after the app's
 * own routes so it runs first (Playwright matches last-registered first).
 */
async function mockQuestions(page: Page, envelopes: Envelopes = {}) {
  await page.route('**/__mock_api__/**', async (route) => {
    const url = route.request().url();
    if (/\/question\/GetQuestions\//i.test(url)) {
      return route.fulfill({ status: 200, json: { isSuccess: true, data: QUESTIONS } });
    }
    // Deliberately HTTP 200 on every one of these; the failure lives in the body.
    if (envelopes.update && /\/question\/Update/i.test(url)) {
      return route.fulfill({ status: 200, json: envelopes.update });
    }
    if (envelopes.delete && /\/question\/Delete/i.test(url)) {
      return route.fulfill({ status: 200, json: envelopes.delete });
    }
    if (envelopes.deactivate && /\/question\/Deactivate/i.test(url)) {
      return route.fulfill({ status: 200, json: envelopes.deactivate });
    }
    return route.fallback();
  });
}

/** gotoAuthenticated signs in as Admin (role 2), which is planner mode. */
async function gotoFormFields(page: Page, envelopes?: Envelopes) {
  await gotoAuthenticated(page, '/app/form-fields');
  await mockQuestions(page, envelopes);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Custom RSVP Fields')).toBeVisible();
}

/** Captures the JSON body of the first matching POST. */
function capturePost(page: Page, pattern: RegExp): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    page.on('request', (req) => {
      if (pattern.test(req.url()) && req.method() === 'POST') {
        resolve(JSON.parse(req.postData() || '{}'));
      }
    });
  });
}

test.describe('A refusal hidden in a 200 is surfaced, not swallowed', () => {
  test('update rejected for existing answers shows the backend message', async ({ page }) => {
    await gotoFormFields(page, {
      update: {
        isSuccess: false,
        statusCode: 422,
        message: 'Update fail because question has more than one answer submitted.',
        data: false,
      },
    });

    await page.click('[title="Edit"]');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    await expect(page.getByRole('alert')).toContainText('has more than one answer submitted');
  });

  test('a genuine success shows no alert', async ({ page }) => {
    await gotoFormFields(page, {
      update: { isSuccess: true, statusCode: 200, message: 'Update successfully.', data: true },
    });

    await page.click('[title="Edit"]');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('a refused delete is surfaced too, since the toggles use the same envelope', async ({ page }) => {
    await gotoFormFields(page, {
      delete: { isSuccess: false, statusCode: 422, message: 'Delete failed.', data: false },
    });

    await page.click('[title="Delete"]');
    await page.getByRole('button', { name: 'Delete Permanently' }).click();

    await expect(page.getByRole('alert')).toContainText('Delete failed.');
  });

  test('a refused deactivate is surfaced too', async ({ page }) => {
    await gotoFormFields(page, {
      deactivate: { isSuccess: false, statusCode: 422, message: 'Deactivate failed.', data: false },
    });

    await page.click('[title="Deactivate question"]');
    // exact: the row's icon button is named "Deactivate question".
    await page.getByRole('button', { name: 'Deactivate', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('Deactivate failed.');
  });
});

test.describe('Every write carries the identifiers the backend validates', () => {
  test('update sends the event GUID as eventGuid, and questionId as a string', async ({ page }) => {
    await gotoFormFields(page);
    const body = capturePost(page, /\/question\/Update/i);

    await page.click('[title="Edit"]');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    const sent = await body;
    expect(sent.eventGuid).toBe(MOCK_EVENT_GUID);
    expect(String(sent.questionId)).toBe('7');
    // Update is a full replace: AssignEventsParam assigns all of these
    // unconditionally, so an omitted key is a wipe, not a no-op.
    for (const key of ['text', 'type', 'options', 'order', 'isRequired']) {
      expect(sent).toHaveProperty(key);
    }
  });

  test('delete sends the event GUID under eventId, since the toggles parse it as a Guid', async ({
    page,
  }) => {
    await gotoFormFields(page);
    const body = capturePost(page, /\/question\/Delete/i);

    await page.click('[title="Delete"]');
    await page.getByRole('button', { name: 'Delete Permanently' }).click();

    const sent = await body;
    // Named eventId, but GetEventGuid parses it, so an integer here is a 400.
    expect(sent.eventId).toBe(MOCK_EVENT_GUID);
    expect(String(sent.questionId)).toBe('7');
  });

  test('deactivate sends the event GUID under eventId', async ({ page }) => {
    await gotoFormFields(page);
    const body = capturePost(page, /\/question\/Deactivate/i);

    await page.click('[title="Deactivate question"]');
    // exact: the row's icon button is named "Deactivate question".
    await page.getByRole('button', { name: 'Deactivate', exact: true }).click();

    const sent = await body;
    expect(sent.eventId).toBe(MOCK_EVENT_GUID);
    expect(String(sent.questionId)).toBe('7');
  });
});
