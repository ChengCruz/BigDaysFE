// docs/qa/guest-page.spec.ts
// What the GUEST sees after the couple edits a question. Real Caddy stack, real
// backend, real DB. Nothing is mocked.
//
// These began as reproductions of findings 1, 2 and 8 and now assert the fixed
// behaviour, so they stand as regressions. The governing rule:
//
//   the question owns existence / type / options / required-ness;
//   the block may override presentation only.
//
// Each test builds its OWN event so they are order-independent and survive a
// Playwright worker restart. Evidence is written per test, never shared.
//
// Run: npx playwright test -c docs/qa/playwright.qa.config.ts
import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFixture, hideQuestion, deleteQuestion, renameQuestion, getRsvps, addQuestion, api,
  type Fixture,
} from "./qa-api";

const EVID = join(dirname(fileURLToPath(import.meta.url)), "evidence");
mkdirSync(EVID, { recursive: true });

const save = (name: string, data: unknown) =>
  writeFileSync(join(EVID, `browser-${name}.json`), JSON.stringify(data, null, 2));

/** Every labelled control the guest is shown, in DOM order, with its real input type. */
async function readForm(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-testid="rsvp-card"]');
    if (!card) return { fields: [] as any[], placeholders: [] as string[] };

    const fields: any[] = [];
    card.querySelectorAll("label").forEach((l) => {
      const box = l.parentElement;
      const ctrl = box?.querySelector("input,select,textarea") as HTMLInputElement | HTMLSelectElement | null;
      if (!ctrl) return;
      fields.push({
        label: (l.textContent || "").replace(/\s+/g, " ").trim(),
        tag: ctrl.tagName.toLowerCase(),
        type: ctrl.getAttribute("type"),
        options: ctrl.tagName === "SELECT"
          ? Array.from((ctrl as HTMLSelectElement).options).map((o) => o.textContent)
          : undefined,
      });
    });

    const placeholders = Array.from(card.querySelectorAll("input[placeholder]"))
      .map((i) => (i as HTMLInputElement).placeholder);

    return { fields, placeholders };
  });
}

async function gotoInvite(page: Page, fx: Fixture) {
  await page.goto(`/rsvp/${fx.slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="rsvp-card"]', { timeout: 30_000 });
}

const labelsOf = (form: { fields: any[] }) => form.fields.map((f) => f.label);

// ─────────────────────────────────────────────────────────────────────────────
test("BASELINE: questions render with their own label, type and options", async ({ page }) => {
  const fx = await buildFixture();
  await gotoInvite(page, fx);

  const form = await readForm(page);
  await page.screenshot({ path: join(EVID, "shot-01-baseline.png"), fullPage: true });
  save("01-baseline", { fixture: fx, ...form });

  const labels = labelsOf(form);
  // Labels inherited from the live question (blocks carry none)...
  expect(labels).toEqual(expect.arrayContaining(["Meal choice", "Need a room"]));
  // ...and the one block with a deliberate override keeps it.
  expect(labels).toContain("Your favourite song");
  expect(labels).not.toContain("Song request");

  // The select question renders as a real <select> carrying its options.
  const meal = form.fields.find((f) => f.label === "Meal choice");
  expect(meal.tag).toBe("select");
  expect(meal.options).toEqual(expect.arrayContaining(["Chicken", "Fish", "Vegetarian"]));
});

// ─────────────────────────────────────────────────────────────────────────────
test("A: HIDING a question removes it from the live invite", async ({ page }) => {
  const fx = await buildFixture();
  expect((await hideQuestion(fx.qSelect, fx.eventGuid)).http).toBe(200);

  // The backend drops it from the guest payload...
  const tmpl = await api("GET", `/event/eventRsvp/slug/${fx.slug}`, undefined, true);
  const served = (tmpl.json?.data?.questions ?? []).map((q: any) => q.questionId);
  expect(served).not.toContain(fx.qSelect);

  await gotoInvite(page, fx);
  const form = await readForm(page);
  await page.screenshot({ path: join(EVID, "shot-02-after-hide.png"), fullPage: true });

  const meal = form.fields.find((f) => f.label === "Meal choice");
  save("02-after-hide", {
    fixture: fx,
    backendServedQuestionIds: served,
    hiddenQuestionId: fx.qSelect,
    stillRenderedToGuest: !!meal,
    labelsShownToGuest: labelsOf(form),
  });

  // ...and the frontend no longer renders past it.
  expect(meal, "hidden question must not be rendered to the guest").toBeFalsy();
  // The rest of the invite is untouched.
  expect(labelsOf(form)).toEqual(expect.arrayContaining(["Your favourite song", "Need a room"]));
});

// ─────────────────────────────────────────────────────────────────────────────
test("A2: UNHIDING brings the field back, with no edit to the design", async ({ page }) => {
  const fx = await buildFixture();

  await hideQuestion(fx.qSelect, fx.eventGuid);
  await gotoInvite(page, fx);
  const hidden = labelsOf(await readForm(page));
  expect(hidden).not.toContain("Meal choice");

  // Re-activate only. The design is never touched.
  const back = await api("POST", "/question/Activate", {
    questionId: String(fx.qSelect), eventId: fx.eventGuid,
  });
  expect(back.http).toBe(200);

  await gotoInvite(page, fx);
  const form = await readForm(page);
  await page.screenshot({ path: join(EVID, "shot-02b-after-unhide.png"), fullPage: true });

  const meal = form.fields.find((f) => f.label === "Meal choice");
  save("02b-after-unhide", {
    fixture: fx,
    labelsWhileHidden: hidden,
    labelsAfterUnhide: labelsOf(form),
    restoredAs: meal ?? null,
  });

  expect(meal, "unhidden question returns without re-editing the design").toBeTruthy();
  // ...and it comes back as a dropdown, not degraded to text.
  expect(meal.tag).toBe("select");
  expect(meal.options).toEqual(expect.arrayContaining(["Chicken", "Fish", "Vegetarian"]));
});

// ─────────────────────────────────────────────────────────────────────────────
test("B: a hidden question cannot be answered from the invite", async ({ page }) => {
  const fx = await buildFixture();
  expect((await hideQuestion(fx.qSelect, fx.eventGuid)).http).toBe(200);

  const net: any[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/rsvp/Create") && r.method() === "POST") {
      try { net.push(JSON.parse(r.postData() || "{}")); } catch { /* ignore */ }
    }
  });

  await gotoInvite(page, fx);

  const card = page.locator('[data-testid="rsvp-card"]');
  await card.locator('input[placeholder="Full name"]').fill("QA Browser Guest");
  await card.locator('input[placeholder="Phone number"]').fill("0123456789");
  await card.locator('input[placeholder="Number of guests"]').fill("2");

  // The hidden question has no input at all now.
  await expect(card.locator('label:has-text("Meal choice")')).toHaveCount(0);

  // A still-visible question is answered, so this proves the form works generally.
  await card.locator('label:has-text("Your favourite song")').locator("..").locator("input")
    .fill("Bohemian Rhapsody");

  await card.getByRole("button", { name: /send rsvp|submit/i }).click();
  await page.waitForResponse((r) => r.url().includes("/rsvp/Create"), { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(EVID, "shot-03-after-submit.png"), fullPage: true });

  const stored = await getRsvps(fx.eventGuid);
  const mine = (stored.json?.data ?? []).find((r: any) => (r.name ?? r.guestName) === "QA Browser Guest");

  save("03-submit-omits-hidden", {
    fixture: fx,
    hiddenQuestionId: fx.qSelect,
    submittedPayload: net[0] ?? null,
    storedAnswers: mine?.answers ?? null,
  });

  expect(mine, "RSVP was stored").toBeTruthy();
  // Nothing was submitted or stored against the hidden question.
  expect((net[0]?.answers ?? []).some((a: any) => String(a.questionId) === String(fx.qSelect))).toBe(false);
  expect((mine.answers ?? []).some((a: any) => String(a.questionId) === String(fx.qSelect))).toBe(false);
  // The visible question was answered normally.
  expect((mine.answers ?? []).some((a: any) => String(a.questionId) === String(fx.qText))).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
test("C: RENAMING a question updates its label on the invite", async ({ page }) => {
  const fx = await buildFixture();
  expect((await renameQuestion(fx.qRename, fx.eventGuid, "Do you need accommodation?", 3)).http).toBe(200);

  const tmpl = await api("GET", `/event/eventRsvp/slug/${fx.slug}`, undefined, true);
  const q = (tmpl.json?.data?.questions ?? []).find((x: any) => x.questionId === fx.qRename);

  await gotoInvite(page, fx);
  const form = await readForm(page);
  await page.screenshot({ path: join(EVID, "shot-04-after-rename.png"), fullPage: true });

  const labels = labelsOf(form);
  save("04-after-rename", {
    fixture: fx,
    questionTextInBackend: q?.text,
    labelsShownToGuest: labels,
  });

  expect(q?.text).toBe("Do you need accommodation?");
  // The rename reaches the guest, because the block no longer snapshots the label.
  expect(labels).toContain("Do you need accommodation?");
  expect(labels).not.toContain("Need a room");
  // A deliberate override is still respected; it is not collateral damage.
  expect(labels).toContain("Your favourite song");
});

// ─────────────────────────────────────────────────────────────────────────────
test("D: DELETING a question removes it from the invite; existing answers survive", async ({ page }) => {
  const fx = await buildFixture();

  // Seed a real answer through the public API so the question is "answered".
  const seeded = await api("POST", "/rsvp/Create", {
    eventId: fx.eventGuid, guestName: "QA Seed Guest", noOfPax: 1, phoneNo: "0", remarks: "",
    createdBy: "QA Seed Guest",
    answers: [{ questionId: String(fx.qSelect), text: "Chicken" }],
  }, true);
  expect(seeded.json?.isSuccess).toBe(true);

  const countAnswers = async () =>
    ((await getRsvps(fx.eventGuid)).json?.data ?? [])
      .flatMap((r: any) => r.answers ?? [])
      .filter((a: any) => String(a.questionId) === String(fx.qSelect)).length;

  const answersBefore = await countAnswers();
  expect(answersBefore).toBeGreaterThan(0);

  const del = await deleteQuestion(fx.qSelect, fx.eventGuid);
  expect(del.json?.isSuccess).toBe(true);

  await gotoInvite(page, fx);
  const form = await readForm(page);
  await page.screenshot({ path: join(EVID, "shot-05-after-delete.png"), fullPage: true });

  const answersAfter = await countAnswers();
  const meal = form.fields.find((f) => f.label === "Meal choice");
  save("05-after-delete", {
    fixture: fx,
    answersBefore, answersAfter,
    stillRenderedToGuest: !!meal,
    labelsShownToGuest: labelsOf(form),
  });

  expect(meal, "deleted question must not be rendered on the invite").toBeFalsy();
  expect(answersAfter).toBe(answersBefore);   // answers are never destroyed
});

// ─────────────────────────────────────────────────────────────────────────────
test("E: a question added AFTER the design was built still reaches guests", async ({ page }) => {
  // A published design covering the original three questions...
  const fx = await buildFixture();

  // ...then the couple thinks of two more. The design knows nothing about these,
  // and both are OPTIONAL -- the case that used to be dropped silently, because
  // only required questions were rescued.
  await addQuestion(fx.eventGuid, "Dietary needs", 0, "", 4);
  await addQuestion(fx.eventGuid, "Bus transfer", 2, "Yes,No", 5);

  await gotoInvite(page, fx);
  const form = await readForm(page);
  await page.screenshot({ path: join(EVID, "shot-10-question-added-later.png"), fullPage: true });

  const labels = labelsOf(form);
  const bus = form.fields.find((f) => f.label === "Bus transfer");
  save("06-question-added-after-design", {
    fixture: fx,
    labelsShownToGuest: labels,
    lateSelectRenderedAs: bus ?? null,
  });

  // The design is a layout, not the list of what gets asked.
  expect(labels).toContain("Dietary needs");
  expect(labels).toContain("Bus transfer");
  // ...and a late dropdown keeps its options instead of degrading to free text.
  expect(bus?.tag).toBe("select");
  expect(bus?.options).toEqual(expect.arrayContaining(["Yes", "No"]));

  // The questions the design DOES cover are still rendered once, not duplicated.
  expect(labels.filter((l) => l === "Meal choice")).toHaveLength(1);
});
