// docs/qa/admin-side.spec.ts
// The couple's side of the same relationship: what the Questions page and the
// RSVP designer show after a question is hidden, and what the couple is told
// when an edit is refused. Real stack, real login, nothing mocked.
//
// View mode is pinned per test via localStorage rather than by clicking the
// sidebar toggle — the mode persists, so a mid-test switch leaks into the next test.
//
// Run: npx playwright test -c docs/qa/playwright.qa.config.ts --project=desktop
import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFixture, hideQuestion, api, type Fixture } from "./qa-api";

const EVID = join(dirname(fileURLToPath(import.meta.url)), "evidence");
mkdirSync(EVID, { recursive: true });

// Validated in qa-api.ts, which throws if either is missing.
const EMAIL = process.env.QA_EMAIL ?? "";
const PASSWORD = process.env.QA_PASSWORD ?? "";

const save = (name: string, data: unknown) =>
  writeFileSync(join(EVID, `admin-${name}.json`), JSON.stringify(data, null, 2));

/** Real UI login — the access token is in-memory, so there is no shortcut. */
async function loginAs(page: Page, fx: Fixture, mode: "couple" | "planner" = "couple") {
  // Retire the What's New announcement before any app script runs: it re-arms on
  // every navigation and blocks clicks with a full-screen overlay. Pin the view
  // mode here too, so tests can't contaminate each other.
  // Keys from src/utils/whatsNew.ts and src/context/UiModeContext.tsx.
  // eventId is pinned here too, not just once after login: EventContext clears a
  // "stale" eventId when the cached events list doesn't contain it, and a
  // just-created event is exactly that case — it would silently fall back to the
  // account's first event and the spec would design the wrong invite.
  await page.addInitScript(
    ({ m, ev }) => {
      localStorage.setItem(
        "bigdays.whatsNew.v1",
        JSON.stringify({ firstSeenAt: Date.now(), seen: ["2026-08-simple-view"] }),
      );
      localStorage.setItem("uiMode", m);
      localStorage.setItem("eventId", ev);
    },
    { m: mode, ev: fx.eventGuid },
  );

  // Real network, real backend: the sign-in POST occasionally lands while the app
  // is still settling and the client bounces back to /login. One retry rather than
  // a longer blind timeout, since waiting doesn't help once it has bounced.
  for (let attempt = 1; ; attempt++) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /enter the portal/i }).click();
    try {
      await page.waitForURL(/\/app/, { timeout: 30_000 });
      return;
    } catch (err) {
      if (attempt >= 3) throw err;
    }
  }
}

/** Wait for the questions list itself, not an arbitrary sleep. */
async function gotoQuestions(page: Page) {
  await page.goto("/app/form-fields", { waitUntil: "networkidle" });
  await page.locator("li").filter({ hasText: "Song request" }).first()
    .waitFor({ timeout: 45_000 });
}

/** One row per question as the couple sees it. */
async function readQuestionRows(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("li"))
      .map((li) => (li.textContent || "").replace(/\s+/g, " ").trim())
      .filter((t) => /Meal choice|Song request|Need a room/.test(t))
  );
}

// ─────────────────────────────────────────────────────────────────────────────
test("E1 — the Questions page DOES tell the couple a question is hidden", async ({ page }) => {
  const fx = await buildFixture();
  await loginAs(page, fx, "couple");

  await gotoQuestions(page);
  const before = await readQuestionRows(page);
  await page.screenshot({ path: join(EVID, "shot-06-questions-before.png"), fullPage: true });

  expect((await hideQuestion(fx.qSelect, fx.eventGuid)).http).toBe(200);
  await page.reload({ waitUntil: "networkidle" });
  // Wait for the marker itself rather than guessing how long the refetch takes.
  await page.locator("li").filter({ hasText: "Meal choice" })
    .filter({ hasText: /hidden/i }).first().waitFor({ timeout: 45_000 });
  const after = await readQuestionRows(page);
  await page.screenshot({ path: join(EVID, "shot-07-questions-after-hide.png"), fullPage: true });

  save("06-questions-page-hidden-marker", {
    fixture: fx, hiddenQuestionId: fx.qSelect,
    rowsBefore: before, rowsAfterHide: after,
  });

  expect(after.find((t) => t.includes("Meal choice")) ?? "").toMatch(/hidden/i);
});

// ─────────────────────────────────────────────────────────────────────────────
test("E2 — the DESIGNER no longer offers a hidden question, and explains existing links", async ({ page }) => {
  const fx = await buildFixture();
  expect((await hideQuestion(fx.qSelect, fx.eventGuid)).http).toBe(200);

  // The RSVP designer is a planner-mode surface.
  await loginAs(page, fx, "planner");

  let fetched: any[] = [];
  page.on("response", async (r) => {
    if (!r.url().includes("/question/GetQuestions/")) return;
    try { fetched = (await r.json())?.data ?? []; } catch { /* ignore */ }
  });

  await page.goto("/app/rsvps/designer-v3", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Layers/ }).waitFor({ timeout: 45_000 });

  // Guard against silently designing the wrong event.
  await expect(page.getByRole("button", { name: /Active event/ })).toContainText("QA Guest Render");

  // The right panel opens on "Blocks"; the block list lives under "Layers".
  await page.getByRole("button", { name: /^Layers/ }).click();
  await page.waitForTimeout(800);

  // formField has no entry in ALL_BLOCKS, so BLOCK_LABEL falls back to the raw type.
  const layer = page.locator('p:text-is("formField")').first();
  await layer.waitFor({ timeout: 30_000 });
  await layer.click();
  await page.waitForTimeout(1000);

  const picker = page.locator("select").filter({ hasText: "Choose a question" }).first();
  await picker.waitFor({ timeout: 15_000 });
  const pickerOptions = await picker.locator("option").allTextContents();
  const selectable = await picker.locator("option:not([disabled])").allTextContents();
  const panelText = await page.locator("aside, [class*='overflow-y-auto']").last().innerText();
  await page.screenshot({ path: join(EVID, "shot-08-designer-picker.png"), fullPage: true });

  save("07-designer-hidden-question-link", {
    fixture: fx, hiddenQuestionId: fx.qSelect,
    designerFetched: fetched.map((q: any) => ({ questionId: q.questionId, text: q.text, isActive: q.isActive })),
    designerPickerOptions: pickerOptions,
    selectableOptions: selectable,
    warningShown: /hidden/i.test(panelText),
  });

  // The designer still fetches it (the Questions page needs inactive rows)...
  expect(fetched.find((q: any) => q.questionId === fx.qSelect)?.isActive).toBe(false);
  // ...but it can no longer be CHOSEN.
  expect(selectable.join(" | ")).not.toContain("Meal choice");
  // The existing link is kept and labelled, not silently dropped...
  expect(pickerOptions.join(" | ")).toMatch(/Meal choice \(hidden\)/i);
  // ...and the couple is told why the field is missing from the invite.
  expect(panelText).toMatch(/hidden/i);
});

// ─────────────────────────────────────────────────────────────────────────────
test("F — editing an ANSWERED question is refused, and the couple is told why", async ({ page }) => {
  const fx = await buildFixture();

  // Seed an answer so the question becomes uneditable.
  const seeded = await api("POST", "/rsvp/Create", {
    eventId: fx.eventGuid, guestName: "QA Answer Seed", noOfPax: 1, phoneNo: "0", remarks: "",
    createdBy: "QA Answer Seed",
    answers: [{ questionId: String(fx.qText), text: "Bohemian Rhapsody" }],
  }, true);
  expect(seeded.json?.isSuccess).toBe(true);

  await loginAs(page, fx, "couple");
  await gotoQuestions(page);

  const responses: any[] = [];
  page.on("response", async (r) => {
    if (!r.url().includes("/question/Update")) return;
    let body: any = null;
    try { body = await r.json(); } catch { /* non-JSON */ }
    responses.push({ status: r.status(), body });
  });

  // Open the editor for "Song request" and rename it.
  await page.getByRole("button", { name: "Edit Song request" }).click();
  await page.waitForTimeout(800);

  const textbox = page.locator('input[type="text"]:visible, textarea:visible').first();
  await textbox.fill("Song request (EDITED)");
  await page.getByRole("button", { name: /^save$|update|confirm/i }).first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(EVID, "shot-09-edit-answered-question.png"), fullPage: true });

  const banner = await page.locator('[role="alert"]').allTextContents();

  // What is the question actually called now?
  const qs = (await api("GET", `/question/GetQuestions/${fx.eventGuid}`)).json?.data ?? [];
  const nowNamed = qs.find((q: any) => q.questionId === fx.qText)?.text;

  save("08-edit-answered-question", {
    fixture: fx,
    updateResponses: responses,
    userVisibleMessage: banner.join(" | ") || "(no alert element found)",
    questionTextAfterAttempt: nowNamed,
    editSilentlyFailed: nowNamed === "Song request",
  });

  // An answer stores only its questionId, so renaming would retitle what the guest
  // already said. The write is refused and the wording stays put.
  expect(nowNamed).toBe("Song request");

  // The refusal now survives the trip. It used to 500 inside LockQuestion, which
  // stamped a column that no longer exists, and the 422 below never got sent.
  expect(responses.some((r) => r.status === 500)).toBe(false);
  expect(responses.some((r) => r.status === 200 && Number(r.body?.statusCode) === 422)).toBe(true);

  // ...so the couple is told the actual reason instead of being asked to retry.
  expect(banner.join(" ")).toMatch(/already answered/i);
  expect(banner.join(" ")).not.toMatch(/try again/i);
});

// ─────────────────────────────────────────────────────────────────────────────
test("G — a first-time design opens with the couple's questions already in it", async ({ page }) => {
  // Questions written BEFORE the designer was ever opened: no design row exists.
  const fx = await buildFixture({ withDesign: false });
  await loginAs(page, fx, "planner");

  await page.goto("/app/rsvps/designer-v3", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Layers/ }).waitFor({ timeout: 45_000 });
  await expect(page.getByRole("button", { name: /Active event/ })).toContainText("QA Guest Render");

  // The canvas is the couple's preview, so the questions must be visible there...
  const canvas = await page.locator('[data-tour="designer-canvas"]').innerText();
  await page.screenshot({ path: join(EVID, "shot-10-first-time-design.png"), fullPage: true });

  // ...and persisting proves they are really in the design, not just painted on.
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForTimeout(4000);

  const saved = await api("GET", `/RsvpDesign/${fx.eventGuid}/design`);
  const blocks = saved.json?.data?.design?.blocks ?? [];
  const guestBlock = blocks.find((b: any) => b.type === "guestDetails");
  const seededIds = (guestBlock?.customQuestions ?? []).map((q: any) => String(q.questionId));

  save("09-first-time-design-seeded", {
    fixture: fx,
    canvasMentionsQuestions: ["Meal choice", "Song request", "Need a room"].filter((t) => canvas.includes(t)),
    savedBlockTypes: blocks.map((b: any) => b.type),
    seededCustomQuestionIds: seededIds,
  });

  // Seeded into the built-in guest-details card, alongside name / phone / pax.
  expect(canvas).toContain("Meal choice");
  expect(canvas).toContain("Song request");
  expect(canvas).toContain("Need a room");
  expect(guestBlock, "starter design keeps its guestDetails block").toBeTruthy();
  expect(seededIds).toEqual(
    expect.arrayContaining([String(fx.qSelect), String(fx.qText), String(fx.qRename)]),
  );
});
