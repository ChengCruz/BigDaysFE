// src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx
// Renders the admin-designed RSVP layout with live form inputs for guests.
// Visual style matches the V3 designer canvas (renderSectionContent).
// All blocks (including attendance, guestDetails) render inline in designed order.
// Auto-inserts default attendance/guestDetails blocks for backward compatibility.
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { RsvpDesign, RsvpBlock } from "../../../../types/rsvpDesign";
import type { FormFieldConfig } from "../../../../api/hooks/useFormFieldsApi";
import type { RsvpSubmitPayload } from "../../../../api/hooks/usePublicRsvpApi";
import { Spinner } from "../../../atoms/Spinner";

interface Props {
  design: RsvpDesign;
  /** Questions embedded in the design (no auth needed) */
  formFields: FormFieldConfig[];
  /** eventGuid used as the submission target */
  eventId: string;
  onSubmit: (payload: RsvpSubmitPayload) => Promise<void>;
  isSubmitting: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function getColorScheme(isLight: boolean) {
  return {
    heading:    isLight ? "#1e293b" : "#ffffff",
    body:       isLight ? "#475569" : "rgba(255,255,255,0.75)",
    muted:      isLight ? "#94a3b8" : "rgba(255,255,255,0.45)",
    faint:      isLight ? "#cbd5e1" : "rgba(255,255,255,0.28)",
    pillBg:     isLight ? "rgba(0,0,0,0.06)"  : "rgba(255,255,255,0.08)",
    pillBorder: isLight ? "rgba(0,0,0,0.10)"  : "rgba(255,255,255,0.15)",
    inputBg:    isLight ? "rgba(0,0,0,0.04)"  : "rgba(255,255,255,0.06)",
    inputBdr:   isLight ? "rgba(0,0,0,0.12)"  : "rgba(255,255,255,0.12)",
  };
}

// ── Countdown component ─────────────────────────────────────────────────────

function CountdownDisplay({
  targetDate, label, accentColor, headingColor, bodyColor,
}: {
  targetDate?: string; label?: string; accentColor: string; headingColor: string; bodyColor: string;
}) {
  const calcDiff = (iso?: string) => {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return null;
    return { days: Math.floor(diff / 86_400_000), hrs: Math.floor((diff % 86_400_000) / 3_600_000), min: Math.floor((diff % 3_600_000) / 60_000), sec: Math.floor((diff % 60_000) / 1_000) };
  };
  const [diff, setDiff] = useState(() => calcDiff(targetDate));
  useEffect(() => { const t = setInterval(() => setDiff(calcDiff(targetDate)), 1_000); return () => clearInterval(t); }, [targetDate]);

  const units = diff ? [{ v: diff.days, u: "Days" }, { v: diff.hrs, u: "Hrs" }, { v: diff.min, u: "Min" }, { v: diff.sec, u: "Sec" }] : null;

  return (
    <div className="px-4 py-10 text-center">
      <p className="text-[10px] uppercase tracking-[0.28em] mb-6 font-semibold" style={{ color: accentColor }}>
        {label || "Counting down to our big day"}
      </p>
      {units ? (
        <div className="flex items-end justify-center gap-1.5 w-full">
          {units.map(({ v, u }, i) => (
            <React.Fragment key={u}>
              <div className="text-center flex-1 min-w-0">
                <div className="font-bold leading-none" style={{ fontFamily: "Georgia, serif", color: headingColor, fontSize: "2rem" }}>
                  {String(v).padStart(2, "0")}
                </div>
                <div className="text-[9px] uppercase tracking-widest mt-1.5 font-semibold" style={{ color: bodyColor, opacity: 0.55 }}>{u}</div>
              </div>
              {i < 3 && <div className="text-xl pb-3 font-light shrink-0" style={{ color: headingColor, opacity: 0.25 }}>:</div>}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <p className="text-lg font-semibold" style={{ color: headingColor }}>The big day is here!</p>
      )}
    </div>
  );
}


export default function RsvpFormRenderer({
  design,
  formFields,
  eventId,
  onSubmit,
  isSubmitting,
}: Props) {
  const {
    blocks: rawBlocks,
    flowPreset = "serene",
    globalBackgroundType,
    globalBackgroundAsset,
    globalBackgroundColor,
    globalOverlay,
    accentColor,
    globalMusicUrl,
    layoutStyle,
    contentWidth = "full",
    blockMarginX = 0,
    blockMarginY = 0,
  } = design;

  // V3 designs save layoutStyle:"flush"; default to flush when unset
  const isFlush = layoutStyle !== "cards";

  // Content width mapping
  const widthClass: Record<string, string> = {
    compact:  "max-w-sm",   // 384px
    standard: "max-w-lg",   // 512px
    wide:     "max-w-2xl",  // 672px
    full:     "",            // no limit
  };
  const maxWidthCls = widthClass[contentWidth] ?? "";

  // Adaptive color scheme — matches V3 designer canvas
  const globalIsLight = globalBackgroundType === "color" && isLightColor(globalBackgroundColor);

  // ── Auto-insert defaults for backward compat ──────────────────────────
  const blocks = useMemo(() => {
    const result = [...rawBlocks];
    const hasAttendance = result.some((b) => b.type === "attendance");
    const hasGuestDetails = result.some((b) => b.type === "guestDetails");

    if (!hasAttendance) {
      result.splice(0, 0, {
        id: "__auto_attendance__",
        type: "attendance",
        title: "Will you be attending?",
        subtitle: "Please let us know",
      });
    }
    if (!hasGuestDetails) {
      const attendanceIdx = result.findIndex((b) => b.type === "attendance");
      result.splice(attendanceIdx + 1, 0, {
        id: "__auto_guest_details__",
        type: "guestDetails",
        title: "Your details",
        subtitle: "Tell us about yourself",
        showFields: { name: true, phone: true, pax: true, remarks: true },
      });
    }
    return result;
  }, [rawBlocks]);

  // ── Required formFieldConfigs not covered by a formField block OR by a
  //    customQuestion embedded inside a guestDetails block ─────────────────
  const missingRequiredFields = useMemo(() => {
    const coveredIds = new Set<string>();
    for (const b of blocks) {
      if (b.type === "formField" && b.questionId) {
        coveredIds.add(b.questionId);
      } else if (b.type === "guestDetails" && b.customQuestions) {
        for (const q of b.customQuestions) {
          if (q.questionId) coveredIds.add(q.questionId);
        }
      }
    }
    return formFields.filter(
      (fc) => fc.isRequired && !coveredIds.has(fc.questionId ?? fc.id ?? "")
    );
  }, [blocks, formFields]);

  // ── Core fields ──────────────────────────────────────────────────────────
  const [guestName, setGuestName] = useState("");
  const [noOfPax, setNoOfPax] = useState<number>(1);
  const [phoneNo, setPhoneNo] = useState("");
  const [remarks, setRemarks] = useState("");

  // ── Custom field answers: keyed by questionId, supports string[] for multi-select ─
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // ── Validation errors ─────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Music player state ─────────────────────────────────────────────────
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearError(questionId);
  };

  const toggleCheckboxAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const arr: string[] = Array.isArray(current) ? current : current ? [current as string] : [];
      const next = arr.includes(option) ? arr.filter((v) => v !== option) : [...arr, option];
      return { ...prev, [questionId]: next };
    });
    clearError(questionId);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Find guestDetails block to check which fields are visible
    const guestBlock = blocks.find((b) => b.type === "guestDetails");
    const showFields = (guestBlock?.type === "guestDetails" ? guestBlock.showFields : undefined) ?? {
      name: true, phone: true, pax: true, remarks: true,
    };

    if (showFields.name !== false && !guestName.trim()) errs.guestName = "Name is required";
    if (showFields.phone !== false && !phoneNo.trim()) errs.phoneNo = "Phone number is required";
    if (showFields.pax !== false && (noOfPax == null || noOfPax < 0)) errs.noOfPax = "Please enter the number of guests";

    // Validate required formField blocks
    blocks.forEach((block) => {
      if (block.type !== "formField" || !block.questionId) return;
      const cfg = formFields.find((f) => (f.questionId ?? f.id) === block.questionId);
      const required = block.required ?? cfg?.isRequired ?? false;
      if (!required) return;

      const val = answers[block.questionId];
      const isEmpty = Array.isArray(val) ? val.length === 0 : !(val ?? "").trim();
      if (isEmpty) {
        errs[block.questionId] = `${block.label || cfg?.label || "This field"} is required`;
      }
    });

    // Validate required customQuestions embedded inside guestDetails
    blocks.forEach((block) => {
      if (block.type !== "guestDetails" || !block.customQuestions) return;
      block.customQuestions.forEach((q) => {
        if (!q.questionId) return;
        const cfg = formFields.find((f) => (f.questionId ?? f.id) === q.questionId);
        const required = q.required ?? cfg?.isRequired ?? false;
        if (!required) return;
        const val = answers[q.questionId];
        const isEmpty = Array.isArray(val) ? val.length === 0 : !(val ?? "").trim();
        if (isEmpty) {
          errs[q.questionId] = `${q.label || cfg?.label || "This field"} is required`;
        }
      });
    });

    // Validate required fields not in design blocks
    missingRequiredFields.forEach((fc) => {
      const id = fc.questionId ?? fc.id ?? "";
      const val = answers[id];
      const isEmpty = Array.isArray(val) ? val.length === 0 : !(val ?? "").trim();
      if (isEmpty) {
        errs[id] = `${fc.label || fc.text || "This field"} is required`;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      eventId,
      guestName: guestName.trim(),
      noOfPax,
      phoneNo: phoneNo.trim(),
      remarks: remarks.trim(),
      answers,
    });
  };

  // ── Shared input style (matches V3 designer) ─────────────────────────
  const inputCls = "w-full rounded-xl px-4 py-3 text-[13px] bg-transparent outline-none placeholder:opacity-40";

  // ── Render a single design block ──────────────────────────────────────
  const renderBlock = (block: RsvpBlock): React.ReactNode => {
    const bgImages = block.background?.images ?? [];
    const activeBg =
      bgImages.find((img) => img.id === block.background?.activeImageId) ??
      bgImages[0] ??
      block.sectionImage;
    const overlayStrength = block.background?.overlay ?? 0.35;

    const sectionStyle: React.CSSProperties = activeBg?.src
      ? {
          backgroundImage: `linear-gradient(rgba(15,23,42,${overlayStrength}),rgba(15,23,42,${overlayStrength})),url(${activeBg.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: flowPreset === "parallax" ? "fixed" : "scroll",
        }
      : {};

    // Adaptive colors: if block has a background image, force dark scheme
    const isLight = activeBg?.src ? false : globalIsLight;
    const clr = getColorScheme(isLight);

    let inner: React.ReactNode = null;

    if (block.type === "headline") {
      inner = (
        <div className={`px-8 py-14 text-${block.align ?? "center"}`} style={{ fontFamily: block.fontFamily || "Georgia, 'Times New Roman', serif" }}>
          <p className="text-[10px] uppercase tracking-[0.28em] mb-4 font-semibold" style={{ color: accentColor }}>Welcome</p>
          <h2 className="text-[2.2rem] font-normal leading-[1.15] mb-2" style={{ color: clr.heading, letterSpacing: "-0.01em" }}>
            {block.title || "Your Headline"}
          </h2>
          {block.subtitle && (
            <p className="text-[13px] leading-relaxed mt-3 max-w-[85%] mx-auto" style={{ color: clr.body }}>{block.subtitle}</p>
          )}
          <div className="w-12 h-px mx-auto mt-7" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)` }} />
        </div>
      );
    } else if (block.type === "text") {
      inner = (
        <div className={`px-8 py-6 text-${block.align ?? "left"}`} style={{ fontFamily: block.fontFamily || undefined }}>
          <p className="text-[13px] leading-[1.7]" style={{ color: block.muted ? clr.muted : clr.body }}>
            {block.body}
          </p>
        </div>
      );
    } else if (block.type === "info") {
      inner = (
        <div className="px-8 py-5 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full px-5 py-2.5 backdrop-blur-sm" style={{ background: clr.pillBg, border: `1px solid ${clr.pillBorder}` }}>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: clr.body }}>{block.label || "Highlight"}</span>
            <span className="w-px h-3 shrink-0" style={{ background: clr.pillBorder }} />
            <span className="text-[11px]" style={{ color: clr.muted }}>{block.content || "Value"}</span>
          </div>
        </div>
      );
    } else if (block.type === "attendance") {
      // Attendance (status) is not supported by the API — skip rendering
      return null;
    } else if (block.type === "guestDetails") {
      const show = block.showFields ?? { name: true, phone: true, pax: true, remarks: true };
      inner = (
        <div className="px-8 py-8">
          <p className="text-[13px] font-semibold mb-1" style={{ color: clr.heading }}>{block.title || "Guest Information"}</p>
          {block.subtitle && <p className="text-xs mb-4" style={{ color: clr.muted }}>{block.subtitle}</p>}
          {!block.subtitle && <div className="mb-4" />}
          <div className="space-y-2">
            {show.name !== false && (
              <div>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); clearError("guestName"); }}
                  placeholder="Full name"
                  className={inputCls}
                  style={{ background: clr.inputBg, border: `1px solid ${errors.guestName ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
                />
                {errors.guestName && <p className="text-[11px] mt-1 text-rose-400">{errors.guestName}</p>}
              </div>
            )}
            {show.phone !== false && (
              <div>
                <input
                  type="text"
                  value={phoneNo}
                  onChange={(e) => { setPhoneNo(e.target.value); clearError("phoneNo"); }}
                  placeholder="Phone number"
                  className={inputCls}
                  style={{ background: clr.inputBg, border: `1px solid ${errors.phoneNo ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
                />
                {errors.phoneNo && <p className="text-[11px] mt-1 text-rose-400">{errors.phoneNo}</p>}
              </div>
            )}
            {show.pax !== false && (
              <div>
                <input
                  type="number"
                  min={0}
                  value={noOfPax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setNoOfPax(isNaN(val) ? 0 : Math.max(0, val));
                    clearError("noOfPax");
                  }}
                  placeholder="Number of guests"
                  className={inputCls}
                  style={{ background: clr.inputBg, border: `1px solid ${errors.noOfPax ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
                />
                {errors.noOfPax && <p className="text-[11px] mt-1 text-rose-400">{errors.noOfPax}</p>}
              </div>
            )}
            {show.remarks !== false && (
              <div>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => { setRemarks(e.target.value); clearError("remarks"); }}
                  placeholder="Remarks"
                  className={inputCls}
                  style={{ background: clr.inputBg, border: `1px solid ${clr.inputBdr}`, color: clr.heading }}
                />
              </div>
            )}
          </div>

          {block.customQuestions && block.customQuestions.length > 0 && (
            <div className="mt-5 pt-5 border-t space-y-3" style={{ borderColor: clr.inputBdr }}>
              <p className="text-[10px] uppercase tracking-[0.28em] font-semibold" style={{ color: accentColor }}>
                Additional questions
              </p>
              {block.customQuestions.map((q) => {
                if (!q.questionId) {
                  // Free-form question with no linked config — render as plain text input
                  // (won't be submitted because there's no questionId to key against)
                  return (
                    <div key={q.id} className="space-y-1.5">
                      <label className="block text-[11px] font-semibold" style={{ color: clr.body }}>
                        {q.label || "Question"}{q.required && <span className="ml-1" style={{ color: accentColor }}>*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={q.placeholder || "Your answer..."}
                        className={inputCls}
                        style={{ background: clr.inputBg, border: `1px solid ${clr.inputBdr}`, color: clr.heading }}
                      />
                      {q.hint && <p className="text-[10px]" style={{ color: clr.faint }}>{q.hint}</p>}
                    </div>
                  );
                }

                const qid = q.questionId;
                const cfg = formFields.find((f) => (f.questionId ?? f.id) === qid);
                const rawOpts = cfg?.options ?? undefined;
                const opts = Array.isArray(rawOpts)
                  ? rawOpts
                  : typeof rawOpts === "string"
                  ? rawOpts.split(",").map((s) => s.trim())
                  : undefined;
                const fieldType = cfg?.typeKey ?? "text";
                const fieldLabel = q.label || cfg?.label || cfg?.text || "Custom field";
                const fieldRequired = q.required ?? cfg?.isRequired ?? false;
                const isCheckboxGroup = fieldType === "checkbox" && opts && opts.length > 1;
                const currentAnswer = answers[qid];
                const checkedValues: string[] = Array.isArray(currentAnswer)
                  ? currentAnswer
                  : currentAnswer
                  ? [currentAnswer as string]
                  : [];

                return (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-[11px] font-semibold" style={{ color: clr.body }}>
                      {fieldLabel}{fieldRequired && <span className="ml-1" style={{ color: accentColor }}>*</span>}
                    </label>
                    {isCheckboxGroup ? (
                      <div className="space-y-1.5">
                        {opts!.map((opt) => (
                          <label key={opt} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checkedValues.includes(opt)}
                              onChange={() => toggleCheckboxAnswer(qid, opt)}
                              className="h-4 w-4 rounded"
                              style={{ accentColor }}
                            />
                            <span className="text-[13px]" style={{ color: clr.body }}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : fieldType === "select" ? (
                      <select
                        value={(currentAnswer as string) ?? ""}
                        onChange={(e) => setAnswer(qid, e.target.value)}
                        className={inputCls}
                        style={{ background: clr.inputBg, border: `1px solid ${errors[qid] ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
                      >
                        <option value="">{q.placeholder || "Select..."}</option>
                        {opts?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={fieldType === "number" ? "number" : "text"}
                        value={(currentAnswer as string) ?? ""}
                        onChange={(e) => setAnswer(qid, e.target.value)}
                        placeholder={q.placeholder || "Your answer..."}
                        className={inputCls}
                        style={{ background: clr.inputBg, border: `1px solid ${errors[qid] ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
                      />
                    )}
                    {q.hint && <p className="text-[10px]" style={{ color: clr.faint }}>{q.hint}</p>}
                    {errors[qid] && <p className="text-[11px] text-rose-400">{errors[qid]}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else if (block.type === "formField") {
      if (!block.questionId) return null;
      const cfg = formFields.find((f) => (f.questionId ?? f.id) === block.questionId);

      const rawOpts = cfg?.options ?? undefined;
      const opts = Array.isArray(rawOpts)
        ? rawOpts
        : typeof rawOpts === "string"
        ? rawOpts.split(",").map((s) => s.trim())
        : undefined;
      const fieldType = cfg?.typeKey ?? "text";
      const fieldLabel = block.label || cfg?.label || cfg?.text || "Custom field";
      const fieldRequired = block.required ?? cfg?.isRequired ?? false;

      const isCheckboxGroup = fieldType === "checkbox" && opts && opts.length > 1;
      const currentAnswer = answers[block.questionId];
      const checkedValues: string[] = Array.isArray(currentAnswer)
        ? currentAnswer
        : currentAnswer
        ? [currentAnswer as string]
        : [];

      inner = (
        <div className="px-8 py-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: clr.muted }}>
            {fieldLabel}{fieldRequired && <span className="ml-1 text-rose-400">*</span>}
          </label>
          {isCheckboxGroup ? (
            <div className="space-y-2">
              {opts!.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkedValues.includes(opt)}
                    onChange={() => toggleCheckboxAnswer(block.questionId!, opt)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor }}
                  />
                  <span className="text-[13px]" style={{ color: clr.body }}>{opt}</span>
                </label>
              ))}
              {errors[block.questionId] && (
                <p className="text-[11px] text-rose-400">{errors[block.questionId]}</p>
              )}
            </div>
          ) : fieldType === "select" ? (
            <div>
              <select
                value={(currentAnswer as string) ?? ""}
                onChange={(e) => setAnswer(block.questionId!, e.target.value)}
                className={inputCls}
                style={{ background: clr.inputBg, border: `1px solid ${errors[block.questionId!] ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
              >
                <option value="">{block.placeholder || "Select..."}</option>
                {opts?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors[block.questionId] && <p className="text-[11px] mt-1 text-rose-400">{errors[block.questionId]}</p>}
            </div>
          ) : (
            <div>
              <input
                type={fieldType === "number" ? "number" : "text"}
                value={(currentAnswer as string) ?? ""}
                onChange={(e) => setAnswer(block.questionId!, e.target.value)}
                placeholder={block.placeholder || "Guest response here..."}
                className={inputCls}
                style={{ background: clr.inputBg, border: `1px solid ${errors[block.questionId!] ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
              />
              {block.hint && <p className="text-[10px] mt-1.5" style={{ color: clr.faint }}>{block.hint}</p>}
              {errors[block.questionId] && <p className="text-[11px] mt-1 text-rose-400">{errors[block.questionId]}</p>}
            </div>
          )}
        </div>
      );
    } else if (block.type === "cta") {
      inner = (
        <div className={`px-8 py-8 flex ${block.align === "center" ? "justify-center" : block.align === "right" ? "justify-end" : "justify-start"}`}>
          {block.href && block.href !== "#" ? (
            <a
              href={block.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-10 py-3.5 text-sm font-semibold transition-shadow hover:opacity-90"
              style={{
                background: block.ctaColor ?? accentColor,
                color: block.ctaTextColor ?? "#fff",
                boxShadow: `0 4px 14px ${block.ctaColor ?? accentColor}44`,
              }}
            >
              {block.label}
            </a>
          ) : (
            <button
              type="button"
              className="rounded-full px-10 py-3.5 text-sm font-semibold transition-shadow hover:opacity-90"
              style={{
                background: block.ctaColor ?? accentColor,
                color: block.ctaTextColor ?? "#fff",
                boxShadow: `0 4px 14px ${block.ctaColor ?? accentColor}44`,
              }}
            >
              {block.label}
            </button>
          )}
        </div>
      );
    } else if (block.type === "image") {
      const active = block.images.find((img) => img.id === block.activeImageId) ?? block.images[0];
      const ratio = block.height === "tall" ? "4 / 3" : block.height === "short" ? "16 / 5" : "16 / 7";
      inner = (
        <div style={{ aspectRatio: ratio }} className="overflow-hidden">
          {active?.src ? (
            <img src={active.src} alt={active.alt ?? ""} className="w-full h-full object-cover" loading="lazy" />
          ) : null}
        </div>
      );
    } else if (block.type === "eventDetails") {
      const showDate = block.showDate ?? true;
      const showTime = block.showTime ?? true;
      const showLocation = block.showLocation ?? true;

      const cards = [
        showDate     && { icon: "\uD83D\uDCC5", label: "Date",  value: "Date TBC" },
        showTime     && { icon: "\u23F0", label: "Time",  value: "Time TBC" },
        showLocation && { icon: "\uD83D\uDCCD", label: "Venue", value: "Venue TBC" },
      ].filter(Boolean) as { icon: string; label: string; value: string }[];

      inner = (
        <div className="px-6 py-10 text-center">
          {block.title && <p className="text-[13px] font-semibold mb-5" style={{ color: clr.body }}>{block.title}</p>}
          <div className="flex gap-2.5 justify-center flex-wrap">
            {cards.map(({ icon, label, value }) => (
              <div key={label} className="flex-1 min-w-[85px] max-w-[150px] rounded-2xl px-3 py-4" style={{ background: clr.pillBg, border: `1px solid ${clr.pillBorder}` }}>
                <div className="text-xl mb-1.5">{icon}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>{label}</div>
                <div className="text-[11px] font-semibold leading-snug" style={{ color: clr.heading }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (block.type === "countdown") {
      const targetDate = block.targetDate;
      inner = <CountdownDisplay targetDate={targetDate} label={block.label} accentColor={accentColor} headingColor={clr.heading} bodyColor={clr.body} />;
    } else if (block.type === "map") {
      const address = block.address ?? "";
      const mapLabel = block.mapLabel ?? "Venue";
      const showDirections = block.showDirections ?? true;
      const hasAddress = !!address;
      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=en`;
      inner = (
        <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 7" }}>
          {hasAddress ? (
            <iframe title="Venue map" src={embedUrl} className="absolute inset-0 w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: isLight ? "#e8ebe0" : "#1a2035" }}>
              <span className="text-3xl opacity-30">{"\uD83D\uDCCD"}</span>
              <p className="text-xs text-center px-6" style={{ color: clr.muted }}>No address provided</p>
            </div>
          )}
          {hasAddress && (
            <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5">
              <div className="rounded-xl px-4 py-2 text-center shadow-lg" style={{ background: isLight ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.85)", border: `1px solid ${clr.pillBorder}` }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accentColor }}>{mapLabel}</p>
                <p className="text-xs font-semibold" style={{ color: clr.heading }}>{address}</p>
              </div>
              {showDirections && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold underline"
                  style={{ color: accentColor }}
                >
                  Get Directions
                </a>
              )}
            </div>
          )}
        </div>
      );
    }

    if (!inner) return null;

    if (isFlush) {
      return (
        <section key={block.id} className="relative overflow-hidden" style={sectionStyle}>
          {inner}
          <div className="h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
        </section>
      );
    }

    return (
      <section
        key={block.id}
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition duration-500 hover:-translate-y-1 ${
          flowPreset === "stacked" ? "scroll-snap-start" : ""
        }`}
        style={sectionStyle}
      >
        {inner}
      </section>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white" style={{ fontFamily: design.globalFontFamily || "Georgia, 'Times New Roman', serif" }}>
      {/* Global background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {globalBackgroundType === "color" && (
          <div className="h-full w-full" style={{ background: globalBackgroundColor }} />
        )}
        {globalBackgroundType === "image" && globalBackgroundAsset && (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${globalBackgroundAsset})` }}
          />
        )}
        {globalBackgroundType === "video" && globalBackgroundAsset && (
          <video
            className="h-full w-full object-cover"
            src={globalBackgroundAsset}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(15,23,42,${globalOverlay})` }} />
      </div>

      {/* Ambient music player (hidden audio + floating button) */}
      {globalMusicUrl && (
        <>
          <audio ref={audioRef} src={globalMusicUrl} loop preload="none" />
          <button
            type="button"
            onClick={toggleMusic}
            title={musicPlaying ? "Pause music" : "Play ambient music"}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-sm transition hover:bg-black/80"
            style={{ borderColor: `${accentColor}40` }}
          >
            {musicPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div
          className={`relative mx-auto flex flex-col ${
            isFlush ? maxWidthCls : `${maxWidthCls || "max-w-3xl"} gap-6 px-4 py-12`
          } ${flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""}`}
          style={
            isFlush
              ? { paddingLeft: blockMarginX, paddingRight: blockMarginX, rowGap: blockMarginY }
              : undefined
          }
        >
          {/* ── All blocks rendered inline in designed order ── */}
          {blocks.map((block) => renderBlock(block))}

          {/* ── Required fields not in design (auto-rendered) ── */}
          {missingRequiredFields.length > 0 && (
            <section className={isFlush ? "" : "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-sm"}>
              <div className={`${isFlush ? "px-8 py-6" : ""} space-y-4`}>
                {missingRequiredFields.map((fc) => {
                  const id = fc.questionId ?? fc.id ?? "";
                  const fieldType = fc.typeKey ?? "text";
                  const fieldLabel = fc.label || fc.text || "Required field";
                  const rawOpts = fc.options;
                  const opts = Array.isArray(rawOpts)
                    ? rawOpts
                    : typeof rawOpts === "string"
                    ? rawOpts.split(",").map((s) => s.trim())
                    : undefined;
                  const isCheckboxGroup = fieldType === "checkbox" && opts && opts.length > 1;
                  const currentAnswer = answers[id];
                  const checkedValues: string[] = Array.isArray(currentAnswer)
                    ? currentAnswer
                    : currentAnswer
                    ? [currentAnswer as string]
                    : [];
                  const clr = getColorScheme(globalIsLight);

                  return (
                    <div key={id} className="w-full">
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: clr.muted }}>
                        {fieldLabel}<span className="ml-1 text-rose-400">*</span>
                      </label>
                      {isCheckboxGroup ? (
                        <div className="space-y-2">
                          {opts!.map((opt) => (
                            <label key={opt} className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checkedValues.includes(opt)}
                                onChange={() => toggleCheckboxAnswer(id, opt)}
                                className="h-4 w-4 rounded"
                                style={{ accentColor }}
                              />
                              <span className="text-[13px]" style={{ color: clr.body }}>{opt}</span>
                            </label>
                          ))}
                          {errors[id] && <p className="text-[11px] text-rose-400">{errors[id]}</p>}
                        </div>
                      ) : (
                        <div>
                          <input
                            type={fieldType === "number" ? "number" : "text"}
                            value={(currentAnswer as string) ?? ""}
                            onChange={(e) => setAnswer(id, e.target.value)}
                            placeholder={fieldLabel}
                            className={inputCls}
                            style={{ background: clr.inputBg, border: `1px solid ${errors[id] ? "#f43f5e" : clr.inputBdr}`, color: clr.heading }}
                          />
                          {errors[id] && <p className="text-[11px] mt-1 text-rose-400">{errors[id]}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Submit button ── */}
          <div className={`flex justify-center ${isFlush ? "py-8" : "pb-8"}`}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-w-[220px] items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-xl transition hover:opacity-90 disabled:opacity-60"
              style={{
                background: design.submitButtonColor ?? accentColor,
                color: design.submitButtonTextColor ?? "#0f172a",
                boxShadow: `0 4px 14px ${design.submitButtonColor ?? accentColor}44`,
              }}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Submitting..." : (design.submitButtonLabel || "Submit RSVP")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
