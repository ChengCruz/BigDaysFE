// docs/qa/run-api-matrix.mjs
// E2E matrix driver — REAL backend, no mocks.
// Exercises Question CRUD against the three consumers that read questions:
//   admin list (GetQuestions) · guest template (eventRsvp/slug) · answer write (rsvp/Create)
// Writes one JSON evidence file per scenario to ./evidence/.
//
// Run: node docs/qa/run-api-matrix.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dns from "node:dns";

// Node's getaddrinfo does not resolve *.localhost the way curl/browsers do.
// Point the Caddy vhost at loopback while keeping the Host header intact.
const origLookup = dns.lookup;
dns.lookup = (hostname, opts, cb) => {
  if (String(hostname).endsWith(".localhost")) {
    if (typeof opts === "function") { cb = opts; opts = {}; }
    if (opts && opts.all) return cb(null, [{ address: "127.0.0.1", family: 4 }]);
    return cb(null, "127.0.0.1", 4);
  }
  return origLookup(hostname, opts, cb);
};

const HERE = dirname(fileURLToPath(import.meta.url));
const EVID = join(HERE, "evidence");
mkdirSync(EVID, { recursive: true });

const BASE = "http://mbd.localhost:8080/api/v1";
// Credentials come from the environment so no real login is committed. Set them
// alongside the run:  QA_EMAIL=... QA_PASSWORD=... npx playwright test -c ...
// See docs/qa/TEST_FLOW.md.
const EMAIL = process.env.QA_EMAIL ?? "";
const PASSWORD = process.env.QA_PASSWORD ?? "";
const API_KEY = process.env.QA_API_KEY ?? "a";
if (!EMAIL || !PASSWORD) {
  throw new Error("QA_EMAIL and QA_PASSWORD must be set — see docs/qa/TEST_FLOW.md");
}

let token = null;
let userGuid = null;
const log = [];

// ── HTTP ────────────────────────────────────────────────────────────────────
async function login() {
  const r = await fetch(`${BASE}/User/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apiKey: API_KEY, author: EMAIL },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j = await r.json();
  token = j.data.accessToken;
  userGuid = j.data.userGuid;
}

/** Token TTL is 300s; transparently re-login on 401. */
async function api(method, path, body, { anon = false } = {}) {
  const send = async () => {
    const headers = { "Content-Type": "application/json", apiKey: API_KEY, author: anon ? "anonymous" : EMAIL };
    if (!anon && token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
    return { http: r.status, json, raw: text.slice(0, 400) };
  };
  let res = await send();
  if (res.http === 401 && !anon) { await login(); res = await send(); }
  return res;
}

const rec = (name, data) => {
  writeFileSync(join(EVID, `${name}.json`), JSON.stringify(data, null, 2));
  log.push({ name, ...data.summary });
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(data.summary, null, 2));
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const qById = (list, id) => (list ?? []).find((q) => String(q.questionId) === String(id));

/** A design block references a question via questionId (GUID path) OR formFieldId (int path). */
const blockFor = (blocks, id) =>
  (blocks ?? []).find((b) => String(b.questionId ?? b.formFieldId) === String(id));

/** Both consumers, side by side — the whole point of the exercise. */
async function readBothSides(slug, eventGuid) {
  const admin = await api("GET", `/question/GetQuestions/${eventGuid}`);
  const guest = await api("GET", `/event/eventRsvp/slug/${slug}`, undefined, { anon: true });
  const tmpl = guest.json?.data ?? {};
  return {
    adminQuestions: (admin.json?.data ?? []).map((q) => ({
      questionId: q.questionId, text: q.text, type: q.type,
      isActive: q.isActive, isRequired: q.isRequired, options: q.options,
    })),
    guestQuestions: (tmpl.questions ?? []).map((q) => ({
      questionId: q.questionId, text: q.text, type: q.type,
      isActive: q.isActive, isRequired: q.isRequired, options: q.options,
    })),
    designBlocks: (tmpl.rsvpDesign?.design?.blocks ?? [])
      .filter((b) => b.type === "formField" || b.type === "guestDetails")
      .map((b) => ({
        id: b.id, type: b.type, questionId: b.questionId, formFieldId: b.formFieldId,
        label: b.label, required: b.required,
        customQuestions: b.customQuestions ?? undefined,
      })),
    designFormFieldConfigs: tmpl.rsvpDesign?.design?.formFieldConfigs ?? null,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
const run = async () => {
  await login();
  console.log(`logged in as ${EMAIL} (${userGuid})`);

  // ─── Setup: dedicated throwaway event ────────────────────────────────────
  const stamp = Date.now();
  const slug = `qa-qrsvp-${stamp}`;
  const created = await api("POST", "/event/Create", {
    name: `QA Question/RSVP ${stamp}`,
    date: "2027-06-12T00:00:00",
    time: "15:00",
    description: "Automated QA — question/design/submit relationship",
    location: "QA Venue",
    userGuid,
    noOfTable: "5",
  });

  const list = await api("GET", "/event/GetEventsListByUser");
  const ev = (list.json?.data ?? []).find((e) => e.eventName === `QA Question/RSVP ${stamp}`);
  if (!ev) { console.error("FATAL: event not created", created); process.exit(1); }
  const eventGuid = ev.eventGuid;

  await api("POST", "/event/UpdateSlug", { eventGuid, slug });
  const evAfter = await api("GET", "/event/GetEventsListByUser");
  const realSlug = (evAfter.json?.data ?? []).find((e) => e.eventGuid === eventGuid)?.slug ?? slug;

  rec("00-setup", {
    summary: { eventGuid, eventID: ev.eventID, slug: realSlug, createHttp: created.http },
    createResponse: created.json,
  });

  // ─── Setup: three questions ──────────────────────────────────────────────
  // Q_SEL  select w/ options — proves type degradation when config is lost
  // Q_RENAME text          — proves label propagation
  // Q_DEL  text            — proves delete-with-answers behaviour
  const mk = (text, type, isRequired, options, order) =>
    api("POST", "/question/Create", { text, type, isRequired, options, order, eventGuid });

  await mk("Meal choice", 2, false, "Chicken,Fish,Vegetarian", 1);
  await mk("Song request", 0, false, "", 2);
  await mk("Need a hotel room", 0, false, "", 3);

  const qList = await api("GET", `/question/GetQuestions/${eventGuid}`);
  const qs = qList.json?.data ?? [];
  const Q_SEL = qs.find((q) => q.text === "Meal choice");
  const Q_RENAME = qs.find((q) => q.text === "Song request");
  const Q_DEL = qs.find((q) => q.text === "Need a hotel room");

  rec("01-questions-created", {
    summary: {
      count: qs.length,
      ids: { Q_SEL: Q_SEL?.questionId, Q_RENAME: Q_RENAME?.questionId, Q_DEL: Q_DEL?.questionId },
      idType: typeof Q_SEL?.questionId,
    },
    questions: qs,
  });

  // ─── Setup: design linking all three, published ──────────────────────────
  // Mirrors exactly what RsvpDesignV3Page posts (mapToBackendPayload shape).
  const designPayload = {
    eventId: eventGuid,
    design: {
      theme: {
        accentColor: "#c9a227",
        background: { type: "color", color: "#0f172a", assetUrl: "" },
        overlayOpacity: 0.3,
        submitButtonLabel: "Send RSVP",
        layoutStyle: "flush",
        contentWidth: "standard",
      },
      layout: { width: 393, maxHeight: 1 },
      previewModes: ["mobile", "desktop"],
      flowPreset: "serene",
      blocks: [
        { id: "b-head", type: "headline", title: "QA Invite", subtitle: "", align: "center", accent: "text-white" },
        { id: "b-guest", type: "guestDetails", title: "Your details", width: 100,
          showFields: { name: true, phone: true, pax: true, remarks: true }, customQuestions: [] },
        // Mirrors transformBlockToBackend EXACTLY: int question ids fail the GUID
        // regex, so the FE omits `questionId` and sends `formFieldId` instead.
        { id: "b-sel", type: "formField", label: "Meal choice", required: false, width: 100,
          formFieldId: Q_SEL.questionId },
        { id: "b-rename", type: "formField", label: "Song request", required: false, width: 100,
          formFieldId: Q_RENAME.questionId },
        { id: "b-del", type: "formField", label: "Need a hotel room", required: false, width: 100,
          formFieldId: Q_DEL.questionId },
        { id: "b-cta", type: "cta", label: "Send RSVP", href: "#", align: "center" },
      ],
      // FE sends this; watching whether it survives the round trip.
      // NOTE: mapToBackendPayload runs a GUID regex over the question id and emits
      // `id: undefined, questionId: undefined` for int ids — JSON.stringify then drops
      // the keys entirely. Reproduced verbatim: these configs go out with NO identity.
      formFieldConfigs: [
        { label: "Meal choice", text: "Meal choice", typeKey: "select", type: 2,
          isRequired: false, options: "Chicken,Fish,Vegetarian", order: 1 },
      ],
    },
    isPublished: false,
    isDraft: true,
  };

  const saved = await api("POST", `/RsvpDesign/${eventGuid}/design`, designPayload);
  const version = saved.json?.data?.version ?? 1;
  const published = await api("PUT", `/RsvpDesign/${eventGuid}/design/${version}/publish`, {});

  rec("02-design-published", {
    summary: {
      saveHttp: saved.http, version, publishHttp: published.http,
      sentFormFieldConfigs: designPayload.design.formFieldConfigs.length,
      returnedFormFieldConfigs: saved.json?.data?.design?.formFieldConfigs,
    },
    saveResponse: saved.json,
  });

  // ─── Probe: the "Add RSVP form" preset path ──────────────────────────────
  // transformBlockToBackend spreads customQuestions VERBATIM (`{...q}`) — unlike
  // formField blocks it applies no GUID regex and no formFieldId fallback, so an
  // int question id goes to the wire as `questionId: "31"`. Probed on its own so
  // a failure here can't be confused with the formField path above.
  const presetPayload = JSON.parse(JSON.stringify(designPayload));
  presetPayload.design.blocks = [
    presetPayload.design.blocks[0],
    { id: "b-guest2", type: "guestDetails", title: "Your details", width: 100,
      showFields: { name: true, phone: true, pax: true, remarks: true },
      customQuestions: [
        { id: "cq-1", questionId: String(Q_SEL.questionId), label: "Meal choice", required: false },
      ] },
  ];
  const presetSave = await api("POST", `/RsvpDesign/${eventGuid}/design`, presetPayload);
  rec("02b-preset-customquestions", {
    summary: {
      http: presetSave.http,
      sentQuestionId: String(Q_SEL.questionId),
      errors: presetSave.json?.errors ?? null,
      VERDICT: presetSave.http === 200
        ? "accepted"
        : "REJECTED — customQuestions[].questionId is not int-compatible on the wire",
    },
    response: presetSave.json,
  });

  // ─── BASELINE ────────────────────────────────────────────────────────────
  const baseline = await readBothSides(realSlug, eventGuid);
  rec("03-baseline", {
    summary: {
      adminCount: baseline.adminQuestions.length,
      guestCount: baseline.guestQuestions.length,
      guestSelOptions: qById(baseline.guestQuestions, Q_SEL.questionId)?.options,
      designFormFieldConfigs: baseline.designFormFieldConfigs,
      blocks: baseline.designBlocks.length,
    },
    ...baseline,
  });

  // ─── A: HIDE the select question ─────────────────────────────────────────
  const deact = await api("POST", "/question/Deactivate", { questionId: String(Q_SEL.questionId), eventId: eventGuid });
  const afterHide = await readBothSides(realSlug, eventGuid);
  rec("04-A-hide-select", {
    summary: {
      deactivateHttp: deact.http,
      deactivateEnvelope: { isSuccess: deact.json?.isSuccess, statusCode: deact.json?.statusCode },
      adminStillLists: !!qById(afterHide.adminQuestions, Q_SEL.questionId),
      adminIsActive: qById(afterHide.adminQuestions, Q_SEL.questionId)?.isActive,
      guestStillLists: !!qById(afterHide.guestQuestions, Q_SEL.questionId),
      designBlockStillPresent: !!blockFor(afterHide.designBlocks, Q_SEL.questionId),
      VERDICT: "guest questions[] drops it, but the design block referencing it remains",
    },
    ...afterHide,
  });

  // ─── B: submit an answer to the HIDDEN question ──────────────────────────
  const submitHidden = await api("POST", "/rsvp/Create", {
    eventId: eventGuid,
    guestName: "QA Hidden Answer",
    noOfPax: 2,
    phoneNo: "0123456789",
    remarks: "answering a hidden question",
    createdBy: "QA Hidden Answer",
    answers: [
      { questionId: String(Q_SEL.questionId), text: "Fish" },       // HIDDEN
      { questionId: String(Q_RENAME.questionId), text: "Yellow Submarine" }, // visible
    ],
  }, { anon: true });

  rec("05-B-submit-answer-to-hidden", {
    summary: {
      http: submitHidden.http,
      isSuccess: submitHidden.json?.isSuccess,
      statusCode: submitHidden.json?.statusCode,
      message: submitHidden.json?.message,
      VERDICT: submitHidden.json?.isSuccess
        ? "ACCEPTED — no validation that the question is visible"
        : "rejected",
    },
    response: submitHidden.json,
  });

  // ─── C: unknown / garbage questionId ─────────────────────────────────────
  const submitGhost = await api("POST", "/rsvp/Create", {
    eventId: eventGuid, guestName: "QA Ghost Question", noOfPax: 1, phoneNo: "0", remarks: "",
    createdBy: "QA Ghost Question",
    answers: [{ questionId: "999999", text: "answer to a question that does not exist" }],
  }, { anon: true });

  rec("06-C-submit-unknown-questionid", {
    summary: {
      http: submitGhost.http, isSuccess: submitGhost.json?.isSuccess,
      message: submitGhost.json?.message,
      VERDICT: submitGhost.json?.isSuccess ? "ACCEPTED — orphan answer stored, no FK" : "rejected",
    },
    response: submitGhost.json,
  });

  // ─── Read the RSVP list back — can the couple see these answers? ─────────
  const rsvpList = await api("GET", `/rsvp/GetRsvp/List/${eventGuid}`);
  const rsvps = rsvpList.json?.data ?? [];
  rec("07-rsvp-list-with-answers", {
    summary: {
      http: rsvpList.http, rsvpCount: rsvps.length,
      answers: rsvps.map((r) => ({
        guestName: r.guestName,
        answers: (r.answers ?? []).map((a) => ({ questionId: a.questionId, text: a.text })),
      })),
      NOTE: "answers carry questionId only — no label/text snapshot",
    },
    rsvps,
  });

  // ─── D: RENAME a question that has NO answers ───────────────────────────
  // Q_DEL has no answers yet — safe rename target.
  const renameClean = await api("POST", "/question/Update", {
    questionId: String(Q_DEL.questionId), eventGuid,
    text: "Need a hotel room (RENAMED)", type: 0, isRequired: false, options: "", order: 3,
  });
  const afterRenameClean = await readBothSides(realSlug, eventGuid);
  rec("08-D-rename-no-answers", {
    summary: {
      http: renameClean.http,
      envelope: { isSuccess: renameClean.json?.isSuccess, statusCode: renameClean.json?.statusCode, message: renameClean.json?.message },
      questionTextNow: qById(afterRenameClean.guestQuestions, Q_DEL.questionId)?.text,
      designBlockLabelNow: blockFor(afterRenameClean.designBlocks, Q_DEL.questionId)?.label,
      VERDICT: "question text changes; design block label is a STALE SNAPSHOT",
    },
    ...afterRenameClean,
  });

  // ─── E: RENAME a question that HAS answers (Q_RENAME answered in step B) ─
  const renameDirty = await api("POST", "/question/Update", {
    questionId: String(Q_RENAME.questionId), eventGuid,
    text: "Song request (SHOULD BE BLOCKED)", type: 0, isRequired: false, options: "", order: 2,
  });
  const afterRenameDirty = await readBothSides(realSlug, eventGuid);
  rec("09-E-rename-with-answers", {
    summary: {
      http: renameDirty.http,
      envelope: { isSuccess: renameDirty.json?.isSuccess, statusCode: renameDirty.json?.statusCode, errorCode: renameDirty.json?.errorCode, message: renameDirty.json?.message },
      textAfter: qById(afterRenameDirty.guestQuestions, Q_RENAME.questionId)?.text,
      EXPECTED_PER_CODE_READ: "HTTP 200, envelope statusCode 422 'question has ... answer submitted'",
      VERDICT: renameDirty.http === 500
        ? "HTTP 500 — the documented 422 refusal is DEAD CODE (EF identity conflict in LockQuestion)"
        : `HTTP ${renameDirty.http}`,
    },
    response: renameDirty.json,
  });

  // ─── F: DELETE a question that HAS answers ──────────────────────────────
  // Q_SEL is hidden AND answered (step B). Delete must be compared with rename.
  const del = await api("POST", "/question/Delete", { questionId: String(Q_SEL.questionId), eventId: eventGuid });
  const afterDelete = await readBothSides(realSlug, eventGuid);
  const rsvpAfterDelete = await api("GET", `/rsvp/GetRsvp/List/${eventGuid}`);

  rec("10-F-delete-with-answers", {
    summary: {
      deleteHttp: del.http,
      envelope: { isSuccess: del.json?.isSuccess, statusCode: del.json?.statusCode, message: del.json?.message },
      adminStillLists: !!qById(afterDelete.adminQuestions, Q_SEL.questionId),
      guestStillLists: !!qById(afterDelete.guestQuestions, Q_SEL.questionId),
      designBlockStillPresent: !!blockFor(afterDelete.designBlocks, Q_SEL.questionId),
      answersStillReturned: (rsvpAfterDelete.json?.data ?? []).flatMap((r) => r.answers ?? [])
        .filter((a) => String(a.questionId) === String(Q_SEL.questionId)).length,
      VERDICT: "delete of an ANSWERED question is allowed (rename is not) — answers orphaned",
    },
    ...afterDelete,
  });

  // ─── G: re-activate — does it come back? ────────────────────────────────
  const react = await api("POST", "/question/Activate", { questionId: String(Q_RENAME.questionId), eventId: eventGuid });
  const deactThenReact = await readBothSides(realSlug, eventGuid);
  rec("11-G-activate-idempotent", {
    summary: {
      http: react.http, isSuccess: react.json?.isSuccess,
      guestLists: !!qById(deactThenReact.guestQuestions, Q_RENAME.questionId),
    },
    ...deactThenReact,
  });

  // ─── H: does the published design still expose the deleted question? ────
  const designNow = await api("GET", `/RsvpDesign/${eventGuid}/design`);
  rec("12-H-design-after-question-churn", {
    summary: {
      http: designNow.http,
      formFieldConfigs: designNow.json?.data?.design?.formFieldConfigs,
      formFieldBlocks: (designNow.json?.data?.design?.blocks ?? [])
        .filter((b) => b.type === "formField")
        .map((b) => ({ questionId: b.questionId, formFieldId: b.formFieldId, label: b.label })),
      VERDICT: "design never reconciled against question state",
    },
    design: designNow.json?.data?.design,
  });

  writeFileSync(join(EVID, "_index.json"), JSON.stringify({
    ranAt: new Date().toISOString(),
    eventGuid, slug: realSlug,
    questionIds: { Q_SEL: Q_SEL.questionId, Q_RENAME: Q_RENAME.questionId, Q_DEL: Q_DEL.questionId },
    scenarios: log,
  }, null, 2));

  console.log(`\n\nDONE. eventGuid=${eventGuid} slug=${realSlug}`);
  console.log(`guest page: http://mbd.localhost:8080/rsvp/${realSlug}`);
};

run().catch((e) => { console.error("FATAL", e); process.exit(1); });
