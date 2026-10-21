/**
 * Post-event feedback page (/app/feedback).
 *
 * The panels (form, thanks, not eligible, already sent) are decided by
 * GET /Feedback/Eligibility, the optional ?event=<guid> param from the feedback
 * email, and the 403/409 answers of POST /Feedback. Already sent shows the saved
 * answers read-only from GET /Feedback/{eventGuid}, or a plain panel without them.
 * With two or more events to show, the Event field becomes a switcher that drives
 * the ?event= param. GET /Feedback/Status decides whether the "Feedback" menu item
 * is shown (planner sidebar, couple shell secondary list) and whether it has a dot.
 * Everything is mocked; no real login or database is involved.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoAuthenticated, mockApi, MOCK_USER } from './helpers';

type Status = 'Eligible' | 'AlreadySubmitted' | 'NotEligible';

const EVENT_A = { eventGuid: 'aaaaaaaa-0000-0000-0000-000000000001', eventName: 'Older Housewarming', eventDate: '2026-08-02' };
const EVENT_B = { eventGuid: 'bbbbbbbb-0000-0000-0000-000000000002', eventName: 'Latest Wedding', eventDate: '2026-09-14' };

type MockAnswer = { status: number; body?: unknown };

/** A GET /Feedback/Status answer. */
const statusAnswer = (available: boolean, pending: boolean): MockAnswer => ({
  status: 200,
  body: {
    isSuccess: true,
    data: { available, pending, eligibleCount: pending ? 1 : 0, submittedCount: available && !pending ? 1 : 0 },
  },
});

/**
 * Opens /app/feedback (with `?event=<guid>` when `eventParam` is given) with the
 * eligibility endpoint answering `events` and GET /Feedback/{eventGuid} answering
 * `mine` (404 by default), and GET /Feedback/Status answering `status` (available
 * and pending by default). Returns the captured POST bodies, the event guids whose
 * saved answer was requested and the status requests made.
 */
async function gotoFeedback(
  page: Page,
  events: { eventGuid: string; eventName: string; eventDate: string; status: Status }[],
  post: MockAnswer = { status: 200, body: { isSuccess: true, data: true } },
  eventParam?: string,
  mine: MockAnswer = { status: 404, body: { isSuccess: false, message: 'Not found' } },
  status: MockAnswer = statusAnswer(true, true)
) {
  await gotoAuthenticated(page, eventParam ? `/app/feedback?event=${eventParam}` : '/app/feedback');
  const posted: Record<string, unknown>[] = [];
  const mineRequested: string[] = [];
  const statusRequests: string[] = [];
  await page.route('**/__mock_api__/Feedback**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (req.method() === 'GET') {
      if (/\/feedback\/eligibility$/i.test(path)) {
        return route.fulfill({ status: 200, json: { isSuccess: true, data: { events } } });
      }
      if (/\/feedback\/status$/i.test(path)) {
        statusRequests.push(path);
        return route.fulfill({ status: status.status, json: status.body ?? { isSuccess: false } });
      }
      mineRequested.push(decodeURIComponent(path.split('/').pop() ?? ''));
      return route.fulfill({ status: mine.status, json: mine.body ?? { isSuccess: false } });
    }
    posted.push(req.postDataJSON());
    return route.fulfill({ status: post.status, json: post.body ?? { isSuccess: false } });
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  return { posted, mineRequested, statusRequests };
}

/** The event the Event field shows: the read-only text, or the selected option of the switcher. */
async function shownEvent(page: Page): Promise<string> {
  return page.getByLabel('Event', { exact: true }).evaluate((el) =>
    el instanceof HTMLSelectElement ? (el.selectedOptions[0]?.text ?? '') : (el as HTMLInputElement).value
  );
}

/** A saved answer as GET /Feedback/{eventGuid} returns it. */
const savedAnswer = (eventGuid: string) => ({
  isSuccess: true,
  data: {
    eventGuid,
    formVersion: 1,
    overall: 4,
    ease: 3,
    recommend: 8,
    canContact: true,
    submittedAt: '2026-10-02T09:30:00Z',
    answers: {
      modulesUsed: ['events', 'rsvpGuests', 'tables'],
      moduleRatings: { events: 3, rsvpGuests: 4 },
      likedModules: ['rsvpGuests'],
      improveModules: ['tables', 'other'],
      liked: 'Guest list import was quick.',
      improve: '',
    },
  },
});

const eligible = (e: typeof EVENT_A) => ({ ...e, status: 'Eligible' as Status });

/** Fills the three required answers so Send Feedback becomes enabled. */
async function fillRequired(page: Page) {
  await page.getByRole('radiogroup', { name: 'How was your overall experience?' }).getByRole('radio', { name: '5 of 5' }).click();
  await page.getByRole('radiogroup', { name: 'How easy was it to get things done?' }).getByRole('radio', { name: '4 of 5' }).click();
  await page.getByRole('radiogroup', { name: /recommend MyBigDays/ }).getByRole('radio', { name: '9', exact: true }).click();
}

test.describe('Feedback page: panels', () => {
  test('with one event, the Event field is read-only and there is no switcher', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B), { ...EVENT_A, status: 'NotEligible' }]);
    await expect(page.getByRole('heading', { name: 'How was MyBigDays for you?' })).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveCount(0);
    const event = page.getByLabel('Event', { exact: true });
    await expect(event).toHaveValue(new RegExp(`^${EVENT_B.eventName} \\(`));
    await expect(event).toHaveAttribute('readonly', '');
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeDisabled();
  });

  test('without a param, opens on the most recent eligible event', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)]);
    await expect(page.getByLabel('Event', { exact: true })).toHaveValue(EVENT_B.eventGuid);
    expect(await shownEvent(page)).toMatch(new RegExp(`^${EVENT_B.eventName} \\(`));
  });

  test('without a param, prefers an eligible event over a later submitted one', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_A), { ...EVENT_B, status: 'AlreadySubmitted' }]);
    await expect(page.getByLabel('Event', { exact: true })).toHaveValue(EVENT_A.eventGuid);
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeVisible();
  });

  test('with a param, opens on that event even when it is not the latest', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)], undefined, EVENT_A.eventGuid);
    await expect(page.getByLabel('Event', { exact: true })).toHaveValue(EVENT_A.eventGuid);
    expect(await shownEvent(page)).toMatch(new RegExp(`^${EVENT_A.eventName} \\(`));
  });

  test('name and email are prefilled from the profile and read-only', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)]);
    const name = page.getByLabel('Your Name');
    const email = page.getByLabel('Email', { exact: true });
    await expect(name).toHaveValue(MOCK_USER.fullName);
    await expect(email).toHaveValue(MOCK_USER.email);
    await expect(name).toHaveAttribute('readonly', '');
    await expect(email).toHaveAttribute('readonly', '');
  });

  test('a param pointing at an already submitted event with no saved answer shows the already sent panel', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B), { ...EVENT_A, status: 'AlreadySubmitted' }], undefined, EVENT_A.eventGuid);
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
  });

  test('a param pointing at a not eligible event shows the not eligible panel', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B), { ...EVENT_A, status: 'NotEligible' }], undefined, EVENT_A.eventGuid);
    await expect(page.getByText("This form isn't open for your account yet")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
  });

  test('a param for an unknown event shows the not eligible panel instead of another event', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)], undefined, 'cccccccc-0000-0000-0000-000000000003');
    await expect(page.getByText("This form isn't open for your account yet")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
  });

  test('shows the not eligible panel when no event qualifies', async ({ page }) => {
    await gotoFeedback(page, [{ ...EVENT_A, status: 'NotEligible' }]);
    await expect(page.getByText("This form isn't open for your account yet")).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
  });

  test('shows the already sent panel when the only finished events were submitted', async ({ page }) => {
    await gotoFeedback(page, [{ ...EVENT_A, status: 'AlreadySubmitted' }]);
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
  });

  test('a 409 on submit with no saved answer switches to the already sent panel', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)], { status: 409 });
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
  });

  test('a 403 on submit switches to the not eligible panel', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)], { status: 403 });
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByText("This form isn't open for your account yet")).toBeVisible();
  });

  test('a 409 with other eligible events stays on the locked event', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)], { status: 409 });
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
    // The eligibility refetch must not swap in the other eligible event's form.
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
  });
});

test.describe('Feedback page: read-only saved answers', () => {
  const submitted = { ...EVENT_A, status: 'AlreadySubmitted' as Status };

  /** The saved answers from `savedAnswer` are on screen and nothing can be changed. */
  async function expectReadOnlyView(page: Page) {
    await expect(page.getByText(/^You sent this feedback on 02 Oct 2026\. Thank you\.$/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us' }).first()).toBeVisible();
    await expect(page.getByText('You already sent feedback for this event')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);

    const overall = page.getByRole('radiogroup', { name: 'How was your overall experience?' });
    await expect(overall.getByRole('radio', { name: '4 of 5' })).toHaveAttribute('aria-checked', 'true');
    const ease = page.getByRole('radiogroup', { name: 'How easy was it to get things done?' });
    await expect(ease.getByRole('radio', { name: '3 of 5' })).toHaveAttribute('aria-checked', 'true');
    const nps = page.getByRole('radiogroup', { name: /recommend MyBigDays/ });
    await expect(nps.getByRole('radio', { name: '8', exact: true })).toHaveAttribute('aria-checked', 'true');

    await expect(page.getByRole('checkbox', { name: /^Events/ })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'RSVPs & Guests' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Tables' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Budget' })).not.toBeChecked();
    await expect(
      page.getByRole('radiogroup', { name: 'RSVPs & Guests rating' }).getByRole('radio', { name: 'Great' })
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      page.getByRole('radiogroup', { name: 'Events rating' }).getByRole('radio', { name: 'Good' })
    ).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radiogroup', { name: 'Budget rating' })).toHaveCount(0);

    const liked = page.getByRole('group', { name: 'Which 2 modules did you like the most?' });
    await expect(liked.getByRole('button', { name: 'RSVPs & Guests' })).toHaveAttribute('aria-pressed', 'true');
    const improve = page.getByRole('group', { name: 'Which 2 modules need the most improvement?' });
    await expect(improve.getByRole('button', { name: 'Tables' })).toHaveAttribute('aria-pressed', 'true');
    await expect(improve.getByRole('button', { name: 'Other' })).toHaveAttribute('aria-pressed', 'true');

    await expect(page.getByLabel('What did MyBigDays do well?')).toHaveValue('Guest list import was quick.');
    await expect(page.getByLabel('What was confusing, slow or missing?')).toHaveValue('');
    await expect(page.getByLabel('You can contact me about my feedback.')).toBeChecked();

    // Every control is disabled.
    const form = page.getByRole('form', { name: 'Your feedback' });
    for (const control of await form.locator('button, textarea, input[type="checkbox"]').all()) {
      await expect(control).toBeDisabled();
    }
    // The event is shown (as a switcher when there is more than one); name and email stay read-only.
    expect(await shownEvent(page)).toMatch(new RegExp(`^${EVENT_A.eventName} \\(`));
    await expect(page.getByLabel('Your Name')).toHaveAttribute('readonly', '');
  }

  test('a param pointing at an already submitted event shows the saved answers read-only', async ({ page }) => {
    const { mineRequested } = await gotoFeedback(
      page,
      [eligible(EVENT_B), submitted],
      undefined,
      EVENT_A.eventGuid,
      { status: 200, body: savedAnswer(EVENT_A.eventGuid) }
    );
    await expectReadOnlyView(page);
    expect(mineRequested).toEqual([EVENT_A.eventGuid]);
  });

  test('without a param, the only submitted event shows its saved answers read-only', async ({ page }) => {
    await gotoFeedback(page, [submitted], undefined, undefined, {
      status: 200,
      body: savedAnswer(EVENT_A.eventGuid),
    });
    await expectReadOnlyView(page);
  });

  test('a 409 on submit fetches the saved answers and shows them read-only', async ({ page }) => {
    // The eligibility refetch after the 409 still says Eligible; the override keeps the read-only view.
    const { mineRequested } = await gotoFeedback(
      page,
      [eligible(EVENT_A)],
      { status: 409 },
      undefined,
      { status: 200, body: savedAnswer(EVENT_A.eventGuid) }
    );
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expectReadOnlyView(page);
    expect(mineRequested).toContain(EVENT_A.eventGuid);
  });

  test('falls back to the plain already sent panel when the saved answer fetch fails', async ({ page }) => {
    await gotoFeedback(page, [submitted], undefined, EVENT_A.eventGuid, { status: 500 });
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
    await expect(page.getByRole('form', { name: 'Your feedback' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
  });

  test('falls back to the plain already sent panel when there is no saved answer (404)', async ({ page }) => {
    await gotoFeedback(page, [submitted], undefined, EVENT_A.eventGuid);
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
    await expect(page.getByRole('form', { name: 'Your feedback' })).toHaveCount(0);
  });
});

test.describe('Feedback page: free text limits', () => {
  test('both textareas stop at 2000 characters and warn near the limit', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)]);
    for (const label of ['What did MyBigDays do well?', 'What was confusing, slow or missing?']) {
      const box = page.getByLabel(label);
      await expect(box).toHaveAttribute('maxlength', '2000');
      await box.fill('a'.repeat(1700));
      await expect(page.getByText('300 characters left')).toHaveCount(0);
      await box.fill('a'.repeat(1850));
      await expect(page.getByText('150 characters left')).toBeVisible();
      await box.fill('a'.repeat(2000));
      await box.press('End');
      await box.pressSequentially('zz');
      await expect(box).toHaveValue('a'.repeat(2000));
      await expect(page.getByText('0 characters left')).toBeVisible();
      await box.fill('');
    }
  });

  test('a 400 shows the server message', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)], {
      status: 400,
      body: { isSuccess: false, message: 'Your answer to "What did MyBigDays do well?" is too long.' },
    });
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByText('Your answer to "What did MyBigDays do well?" is too long.')).toBeVisible();
    await expect(page.getByText("Couldn't send your feedback. Please try again in a moment.")).toHaveCount(0);
    // The form stays up so the user can fix their answer.
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeVisible();
  });

  test('a 400 without a message falls back to the generic error', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)], { status: 400, body: { isSuccess: false } });
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByText("Couldn't send your feedback. Please try again in a moment.")).toBeVisible();
  });
});

test.describe('Feedback page: modules and picks', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B)]);
  });

  test('Events is ticked and locked, and its rating is already visible', async ({ page }) => {
    const events = page.getByRole('checkbox', { name: /^Events/ });
    await expect(events).toBeChecked();
    await expect(events).toBeDisabled();
    await expect(page.getByRole('radiogroup', { name: 'Events rating' })).toBeVisible();
  });

  test('Check-in and Crew are one module', async ({ page }) => {
    await expect(page.getByRole('checkbox', { name: /QR Check-in \(incl\. Crew\)/ })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /^Crew$/ })).toHaveCount(0);
  });

  test('RSVPs and Guests are one module', async ({ page }) => {
    await expect(page.getByRole('checkbox')).toHaveCount(11);
    await expect(page.getByRole('checkbox', { name: 'RSVPs & Guests', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'RSVPs', exact: true })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: 'Guests', exact: true })).toHaveCount(0);
  });

  test('ticking a module reveals its rating and unticking removes it', async ({ page }) => {
    await expect(page.getByRole('radiogroup', { name: 'RSVPs & Guests rating' })).toHaveCount(0);
    await page.getByRole('checkbox', { name: 'RSVPs & Guests' }).check();
    const rating = page.getByRole('radiogroup', { name: 'RSVPs & Guests rating' });
    await expect(rating).toBeVisible();
    await rating.getByRole('radio', { name: 'Great' }).click();
    await expect(rating.getByRole('radio', { name: 'Great' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('checkbox', { name: 'RSVPs & Guests' }).uncheck();
    await expect(page.getByRole('radiogroup', { name: 'RSVPs & Guests rating' })).toHaveCount(0);
  });

  test('pick lists offer only ticked modules plus Other and None', async ({ page }) => {
    const liked = page.getByRole('group', { name: 'Which 2 modules did you like the most?' });
    await expect(liked.getByRole('button')).toHaveText(['Events', 'Other', 'None']);
    await page.getByRole('checkbox', { name: 'Tables' }).check();
    await expect(liked.getByRole('button')).toHaveText(['Events', 'Tables', 'Other', 'None']);
  });

  test('allows at most 2 picks, and None clears and locks the rest', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'RSVPs & Guests' }).check();
    await page.getByRole('checkbox', { name: 'Tables' }).check();
    const liked = page.getByRole('group', { name: 'Which 2 modules did you like the most?' });

    await liked.getByRole('button', { name: 'RSVPs & Guests' }).click();
    await liked.getByRole('button', { name: 'Tables' }).click();
    // Two picked: the remaining modules and Other are blocked, None stays available.
    await expect(liked.getByRole('button', { name: 'Events' })).toBeDisabled();
    await expect(liked.getByRole('button', { name: 'Other' })).toBeDisabled();
    await expect(liked.getByRole('button', { name: 'None' })).toBeEnabled();

    await liked.getByRole('button', { name: 'None' }).click();
    await expect(liked.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true');
    await expect(liked.getByRole('button', { name: 'RSVPs & Guests' })).toHaveAttribute('aria-pressed', 'false');
    await expect(liked.getByRole('button', { name: 'RSVPs & Guests' })).toBeDisabled();

    // Picking None again frees the list.
    await liked.getByRole('button', { name: 'None' }).click();
    await expect(liked.getByRole('button', { name: 'RSVPs & Guests' })).toBeEnabled();
  });

  test('unticking a module drops it from both pick lists', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Budget' }).check();
    const improve = page.getByRole('group', { name: 'Which 2 modules need the most improvement?' });
    await improve.getByRole('button', { name: 'Budget' }).click();
    await expect(improve.getByRole('button', { name: 'Budget' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('checkbox', { name: 'Budget' }).uncheck();
    await expect(improve.getByRole('button', { name: 'Budget' })).toHaveCount(0);
  });
});

test.describe('Feedback page: submit', () => {
  test('sends the agreed payload and shows the thank you panel', async ({ page }) => {
    const { posted } = await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)]);

    await fillRequired(page);
    await page.getByRole('checkbox', { name: 'RSVPs & Guests' }).check();
    await page.getByRole('checkbox', { name: 'Tables' }).check();
    await page.getByRole('radiogroup', { name: 'RSVPs & Guests rating' }).getByRole('radio', { name: 'Great' }).click();
    await page.getByRole('radiogroup', { name: 'Tables rating' }).getByRole('radio', { name: 'Good' }).click();

    const liked = page.getByRole('group', { name: 'Which 2 modules did you like the most?' });
    await liked.getByRole('button', { name: 'Tables' }).click();
    await liked.getByRole('button', { name: 'RSVPs & Guests' }).click();
    await page.getByRole('group', { name: 'Which 2 modules need the most improvement?' }).getByRole('button', { name: 'Other' }).click();

    await page.getByLabel('What did MyBigDays do well?').fill('Table plan was easy.');
    await page.getByLabel('You can contact me about my feedback.').check();

    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeVisible();

    expect(posted).toHaveLength(1);
    expect(posted[0]).toEqual({
      eventGuid: EVENT_B.eventGuid,
      formVersion: 1,
      overall: 5,
      ease: 4,
      recommend: 9,
      modulesUsed: ['events', 'rsvpGuests', 'tables'],
      moduleRatings: { rsvpGuests: 4, tables: 3 },
      likedModules: ['tables', 'rsvpGuests'],
      improveModules: ['other'],
      liked: 'Table plan was easy.',
      improve: '',
      canContact: true,
    });
    expect(posted[0]).not.toHaveProperty('name');
  });

  test('submits for the event named in the param', async ({ page }) => {
    const { posted } = await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)], undefined, EVENT_A.eventGuid);
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeVisible();
    expect(posted).toHaveLength(1);
    expect(posted[0].eventGuid).toBe(EVENT_A.eventGuid);
    expect(posted[0]).not.toHaveProperty('name');
  });

  test('the thank you panel offers the other unanswered event, and opens its clean form', async ({ page }) => {
    const { posted } = await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)]);
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeVisible();

    await page.getByRole('button', { name: /^Give feedback for Older Housewarming/ }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeHidden();
    expect(await shownEvent(page)).toContain('Older Housewarming');
    expect(new URL(page.url()).searchParams.get('event')).toBe(EVENT_A.eventGuid);
    // A clean form: the required ratings are not carried over.
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeDisabled();
    expect(posted).toHaveLength(1);
  });

  test('the thank you panel has no extra button when no other event is unanswered', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_B), { ...EVENT_A, status: 'AlreadySubmitted' as Status }]);
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Give feedback for/ })).toHaveCount(0);
  });
});

test.describe('Feedback page: event switcher', () => {
  const submitted = { ...EVENT_A, status: 'AlreadySubmitted' as Status };

  test('lists only the events with a form or saved answers, latest first', async ({ page }) => {
    const EVENT_C = { eventGuid: 'cccccccc-0000-0000-0000-000000000003', eventName: 'Cancelled Party', eventDate: '2026-10-01' };
    await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B), { ...EVENT_C, status: 'NotEligible' }]);
    const select = page.getByRole('combobox', { name: 'Event' });
    await expect(select).toBeVisible();
    await expect(select.locator('option')).toHaveText([
      new RegExp(`^${EVENT_B.eventName} \\(`),
      new RegExp(`^${EVENT_A.eventName} \\(`),
    ]);
  });

  test('changing the event updates the param and resets the form', async ({ page }) => {
    const { posted } = await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)]);
    const select = page.getByRole('combobox', { name: 'Event' });
    await expect(select).toHaveValue(EVENT_B.eventGuid);
    await fillRequired(page);
    await page.getByLabel('What did MyBigDays do well?').fill('Half typed.');

    await select.selectOption(EVENT_A.eventGuid);
    await expect(page).toHaveURL((url) => url.searchParams.get('event') === EVENT_A.eventGuid);
    await expect(page.getByRole('combobox', { name: 'Event' })).toHaveValue(EVENT_A.eventGuid);
    // A fresh form for the other event.
    await expect(page.getByLabel('What did MyBigDays do well?')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeDisabled();

    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeVisible();
    expect(posted[0].eventGuid).toBe(EVENT_A.eventGuid);
  });

  test('switching replaces the history entry instead of adding one', async ({ page }) => {
    await gotoFeedback(page, [eligible(EVENT_A), eligible(EVENT_B)]);
    const before = await page.evaluate(() => history.length);
    await page.getByRole('combobox', { name: 'Event' }).selectOption(EVENT_A.eventGuid);
    await expect(page).toHaveURL((url) => url.searchParams.get('event') === EVENT_A.eventGuid);
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test('switching to a submitted event shows its saved answers, and back to the form', async ({ page }) => {
    const { mineRequested } = await gotoFeedback(
      page,
      [eligible(EVENT_B), submitted],
      undefined,
      undefined,
      { status: 200, body: savedAnswer(EVENT_A.eventGuid) }
    );
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Event' }).selectOption(EVENT_A.eventGuid);
    await expect(page.getByText(/^You sent this feedback on 02 Oct 2026\. Thank you\.$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toHaveCount(0);
    expect(mineRequested).toEqual([EVENT_A.eventGuid]);
    // The switcher stays usable in the read-only view.
    const select = page.getByRole('combobox', { name: 'Event' });
    await expect(select).toBeEnabled();

    await select.selectOption(EVENT_B.eventGuid);
    await expect(page).toHaveURL((url) => url.searchParams.get('event') === EVENT_B.eventGuid);
    await expect(page.getByRole('button', { name: 'Send Feedback' })).toBeVisible();
    await expect(page.getByLabel('What did MyBigDays do well?')).toHaveValue('');
  });
});

test.describe('Feedback page: status refresh', () => {
  test('a successful submit refetches the menu status', async ({ page }) => {
    const { statusRequests } = await gotoFeedback(page, [eligible(EVENT_B)]);
    await expect.poll(() => statusRequests.length).toBeGreaterThan(0);
    const before = statusRequests.length;
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByRole('heading', { name: /^Thank you/ })).toBeVisible();
    await expect.poll(() => statusRequests.length).toBeGreaterThan(before);
  });

  test('a 409 on submit also refetches the menu status', async ({ page }) => {
    const { statusRequests } = await gotoFeedback(page, [eligible(EVENT_B)], { status: 409 });
    await expect.poll(() => statusRequests.length).toBeGreaterThan(0);
    const before = statusRequests.length;
    await fillRequired(page);
    await page.getByRole('button', { name: 'Send Feedback' }).click();
    await expect(page.getByText('You already sent feedback for this event')).toBeVisible();
    await expect.poll(() => statusRequests.length).toBeGreaterThan(before);
  });
});

/**
 * The "Feedback" menu item. GET /Feedback/Status is the only input: the item shows
 * when `available`, with a "New" dot while `pending`, and is hidden otherwise,
 * including while loading and when the call fails.
 */
test.describe('Feedback menu item', () => {
  const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

  /** Lands on the dashboard with GET /Feedback/Status answering `status`. */
  async function gotoWithStatus(page: Page, status: MockAnswer | 'abort') {
    await gotoAuthenticated(page, '/app/dashboard');
    await page.route('**/__mock_api__/Feedback/Status', (route) =>
      status === 'abort'
        ? route.abort()
        : route.fulfill({ status: status.status, json: status.body ?? { isSuccess: false } })
    );
    await page.reload();
    await page.waitForLoadState('networkidle');
  }

  /** The planner sidebar slides in on mobile; open it so its links are on screen. */
  async function openPlannerNav(page: Page) {
    if (isMobile(page)) await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  }

  const plannerItem = (page: Page) => page.locator('aside a[href="/app/feedback"]');

  test.describe('planner sidebar', () => {
    test('is shown when feedback is available, and links to the page', async ({ page }) => {
      await gotoWithStatus(page, statusAnswer(true, false));
      await openPlannerNav(page);
      const item = plannerItem(page);
      await expect(item).toBeVisible();
      await expect(item).toHaveAttribute('title', 'Feedback');
      await expect(item.getByRole('img', { name: 'New' })).toHaveCount(0);
      // It sits right after Contact Us.
      await expect(page.locator('aside nav a').last()).toHaveAttribute('href', '/app/feedback');
      await item.click();
      await expect(page).toHaveURL(/\/app\/feedback$/);
    });

    test('shows the New dot while an answer is pending', async ({ page }) => {
      await gotoWithStatus(page, statusAnswer(true, true));
      await openPlannerNav(page);
      await expect(plannerItem(page).getByRole('img', { name: 'New' })).toBeVisible();
    });

    test('is hidden when feedback is not available', async ({ page }) => {
      await gotoWithStatus(page, statusAnswer(false, false));
      await openPlannerNav(page);
      await expect(page.locator('aside a[title="Contact Us"]')).toBeVisible();
      await expect(plannerItem(page)).toHaveCount(0);
    });

    test('is hidden when the status call fails', async ({ page }) => {
      await gotoWithStatus(page, { status: 500, body: { isSuccess: false } });
      await openPlannerNav(page);
      await expect(page.locator('aside a[title="Contact Us"]')).toBeVisible();
      await expect(plannerItem(page)).toHaveCount(0);
    });

    test('is hidden when the status call never answers', async ({ page }) => {
      await gotoWithStatus(page, 'abort');
      await openPlannerNav(page);
      await expect(page.locator('aside a[title="Contact Us"]')).toBeVisible();
      await expect(plannerItem(page)).toHaveCount(0);
    });

    test('accepts a bare (unwrapped) status body', async ({ page }) => {
      await gotoWithStatus(page, {
        status: 200,
        body: { available: true, pending: true, eligibleCount: 1, submittedCount: 0 },
      });
      await openPlannerNav(page);
      await expect(plannerItem(page).getByRole('img', { name: 'New' })).toBeVisible();
    });
  });

  test.describe('couple shell', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('uiMode', 'couple'));
    });

    /** Desktop and tablet have the rail; mobile mirrors it in the account menu. */
    async function coupleItem(page: Page) {
      if (isMobile(page)) {
        await page.getByLabel('Account').click();
        return page.getByRole('button', { name: /^Feedback/ });
      }
      return page.locator('aside a[href="/app/feedback"]');
    }

    test('lists Feedback with the secondary destinations, after Get help', async ({ page }) => {
      await gotoWithStatus(page, statusAnswer(true, true));
      const item = await coupleItem(page);
      await expect(item).toBeVisible();
      await expect(item.getByRole('img', { name: 'New' })).toBeVisible();
      if (!isMobile(page)) {
        const hrefs = await page.locator('aside a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
        expect(hrefs.indexOf('/app/feedback')).toBe(hrefs.indexOf('/app/contact') + 1);
        // Not a section tab.
        await expect(page.getByRole('navigation', { name: 'Sections' }).locator('a[href="/app/feedback"]')).toHaveCount(0);
      }
      await item.click();
      await expect(page).toHaveURL(/\/app\/feedback$/);
    });

    test('has no dot once nothing is pending', async ({ page }) => {
      await gotoWithStatus(page, statusAnswer(true, false));
      const item = await coupleItem(page);
      await expect(item).toBeVisible();
      await expect(item.getByRole('img', { name: 'New' })).toHaveCount(0);
    });

    test('is hidden when feedback is not available', async ({ page }) => {
      await gotoWithStatus(page, statusAnswer(false, false));
      if (isMobile(page)) {
        await page.getByLabel('Account').click();
        await expect(page.getByRole('button', { name: 'Your account' })).toBeVisible();
        await expect(page.getByRole('button', { name: /^Feedback/ })).toHaveCount(0);
      } else {
        await expect(page.locator('aside a[href="/app/contact"]')).toBeVisible();
        await expect(page.locator('aside a[href="/app/feedback"]')).toHaveCount(0);
      }
    });
  });

  test('is hidden in demo mode', async ({ page }) => {
    // Even a status that says "available" must not surface for a demo visitor.
    await page.route('**/__mock_api__/Feedback/Status', (route) =>
      route.fulfill({ status: 200, json: statusAnswer(true, true).body })
    );
    await page.goto('/demo');
    await expect(page).toHaveURL(/\/app\/guests/);
    await expect(page.getByText(/Sample wedding/i)).toBeVisible();
    await expect(page.locator('a[href="/app/feedback"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Feedback/ })).toHaveCount(0);
  });
});

test.describe('Feedback page: deep link through the login', () => {
  test('keeps ?event=<guid> when a logged-out owner has to sign in first', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/app/feedback?event=${EVENT_A.eventGuid}`);
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // The query string must survive the login, or the form opens on the wrong event.
    await expect(page).toHaveURL(
      (url) => url.pathname === '/app/feedback' && url.searchParams.get('event') === EVENT_A.eventGuid,
      { timeout: 8000 },
    );
  });
});
