// docs/qa/qa-api.ts
// Thin REAL-backend API client shared by the browser spec. No mocks.
import dns from "node:dns";

// Chromium resolves *.localhost natively; Node's getaddrinfo does not. Only the
// test-runner-side fetch needs this; the browser under test is unaffected.
const origLookup = dns.lookup;
(dns as any).lookup = (hostname: string, opts: any, cb: any) => {
  if (String(hostname).endsWith(".localhost")) {
    if (typeof opts === "function") { cb = opts; opts = {}; }
    if (opts && opts.all) return cb(null, [{ address: "127.0.0.1", family: 4 }]);
    return cb(null, "127.0.0.1", 4);
  }
  return (origLookup as any)(hostname, opts, cb);
};

const BASE = "http://mbd.localhost:8080/api/v1";
// Credentials come from the environment so no real login is committed. Set them
// alongside the run:  QA_EMAIL=... QA_PASSWORD=... npx playwright test -c ...
// See docs/qa/TEST_FLOW.md.
const EMAIL = process.env.QA_EMAIL ?? "";
const PASSWORD = process.env.QA_PASSWORD ?? "";
const API_KEY = process.env.QA_API_KEY ?? "a";
if (!EMAIL || !PASSWORD) {
  throw new Error("QA_EMAIL and QA_PASSWORD must be set; see docs/qa/TEST_FLOW.md");
}

let token: string | null = null;
let userGuid: string | null = null;

export async function login() {
  const r = await fetch(`${BASE}/User/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apiKey: API_KEY, author: EMAIL },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j: any = await r.json();
  token = j.data.accessToken;
  userGuid = j.data.userGuid;
  return { token, userGuid };
}

/** Access tokens live 300s; re-login transparently on 401. */
export async function api(method: string, path: string, body?: unknown, anon = false) {
  const send = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apiKey: API_KEY,
      author: anon ? "anonymous" : EMAIL,
    };
    if (!anon && token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
    return { http: r.status, json };
  };
  let res = await send();
  if (res.http === 401 && !anon) { await login(); res = await send(); }
  return res;
}

export interface Fixture {
  eventGuid: string;
  slug: string;
  qSelect: number;   // "Meal choice"   : select, 3 options
  qText: number;     // "Song request"  : short text
  qRename: number;   // "Need a room"   : short text, rename target
}

/**
 * Builds a clean event: 3 questions, and by default a PUBLISHED design whose
 * formField blocks link all three. Mirrors mapToBackendPayload byte-for-byte,
 * including the int-id workarounds (blocks use `formFieldId`; formFieldConfigs
 * carry no id).
 *
 * Pass `{ withDesign: false }` for the first-time case: questions written before
 * the couple has ever opened the designer, so no design row exists at all.
 */
export async function buildFixture(opts: { withDesign?: boolean } = {}): Promise<Fixture> {
  const { withDesign = true } = opts;
  await login();
  const stamp = Date.now();
  const name = `QA Guest Render ${stamp}`;

  await api("POST", "/event/Create", {
    name, date: "2027-09-18T00:00:00", time: "16:00",
    description: "Automated QA: guest page rendering",
    location: "QA Venue", userGuid, noOfTable: "5",
  });

  const list = await api("GET", "/event/GetEventsListByUser");
  const ev = (list.json?.data ?? []).find((e: any) => e.eventName === name);
  if (!ev) throw new Error("fixture event not created");
  const eventGuid = ev.eventGuid;

  // The backend derives/sanitises the slug itself, so never trust the one we asked
  // for. Read back what it actually stored.
  await api("POST", "/event/UpdateSlug", { eventGuid, slug: `qa-render-${stamp}` });
  const reread = await api("GET", "/event/GetEventsListByUser");
  const slug = (reread.json?.data ?? []).find((e: any) => e.eventGuid === eventGuid)?.slug;
  if (!slug) throw new Error("fixture slug not resolved");

  const mk = (text: string, type: number, options: string, order: number) =>
    api("POST", "/question/Create", { text, type, isRequired: false, options, order, eventGuid });

  await mk("Meal choice", 2, "Chicken,Fish,Vegetarian", 1);
  await mk("Song request", 0, "", 2);
  await mk("Need a room", 0, "", 3);

  const qs = (await api("GET", `/question/GetQuestions/${eventGuid}`)).json?.data ?? [];
  const find = (t: string) => qs.find((q: any) => q.text === t).questionId;
  const qSelect = find("Meal choice");
  const qText = find("Song request");
  const qRename = find("Need a room");

  if (!withDesign) return { eventGuid, slug, qSelect, qText, qRename };

  const design = {
    eventId: eventGuid,
    design: {
      theme: {
        accentColor: "#c9a227",
        background: { type: "color", color: "#0f172a", assetUrl: "" },
        overlayOpacity: 0.3, submitButtonLabel: "Send RSVP",
        layoutStyle: "flush", contentWidth: "standard",
      },
      layout: { width: 393, maxHeight: 1 },
      previewModes: ["mobile", "desktop"],
      flowPreset: "serene",
      // Blocks carry NO label/required; that is what the designer produces now that
      // applyQuestionToBlock stops snapshotting them, so the live question supplies
      // both. b-txt is the deliberate exception: it keeps an explicit label, to prove
      // a real override still wins.
      blocks: [
        { id: "b-head", type: "headline", title: "QA Invite", align: "center", accent: "text-white" },
        { id: "b-guest", type: "guestDetails", title: "Your details", width: 100,
          showFields: { name: true, phone: true, pax: true, remarks: true } },
        { id: "b-sel", type: "formField", width: 100, formFieldId: qSelect },
        { id: "b-txt", type: "formField", width: 100, formFieldId: qText, label: "Your favourite song" },
        { id: "b-ren", type: "formField", width: 100, formFieldId: qRename },
        { id: "b-cta", type: "cta", ctaLabel: "Send RSVP", href: "#", align: "center" },
      ],
    },
    isPublished: false, isDraft: true,
  };

  const saved = await api("POST", `/RsvpDesign/${eventGuid}/design`, design);
  if (saved.http !== 200) throw new Error(`design save failed ${saved.http}: ${JSON.stringify(saved.json)}`);
  const version = saved.json?.data?.version ?? 1;
  const pub = await api("PUT", `/RsvpDesign/${eventGuid}/design/${version}/publish`, {});
  if (pub.http !== 200) throw new Error(`publish failed ${pub.http}`);

  return { eventGuid, slug, qSelect, qText, qRename };
}

export const hideQuestion = (questionId: number, eventGuid: string) =>
  api("POST", "/question/Deactivate", { questionId: String(questionId), eventId: eventGuid });

export const deleteQuestion = (questionId: number, eventGuid: string) =>
  api("POST", "/question/Delete", { questionId: String(questionId), eventId: eventGuid });

export const renameQuestion = (questionId: number, eventGuid: string, text: string, order: number) =>
  api("POST", "/question/Update", { questionId: String(questionId), eventGuid, text, type: 0, isRequired: false, options: "", order });

export const getRsvps = (eventGuid: string) =>
  api("GET", `/rsvp/GetRsvp/List/${eventGuid}`);

/** Adds a question to an event that already exists (and may already have a design). */
export async function addQuestion(
  eventGuid: string, text: string, type: number, options: string, order: number,
  isRequired = false,
) {
  const res = await api("POST", "/question/Create", { text, type, isRequired, options, order, eventGuid });
  if (res.http !== 200) throw new Error(`question create failed ${res.http}`);
  const qs = (await api("GET", `/question/GetQuestions/${eventGuid}`)).json?.data ?? [];
  const made = qs.find((q: any) => q.text === text);
  if (!made) throw new Error(`question "${text}" not found after create`);
  return made.questionId as number;
}
