// src/components/pages/Public/RSVPPublic/RsvpFormRenderer.tsx
// Renders the admin-designed RSVP layout with live form inputs for guests.
// All blocks (including attendance, guestDetails) render inline in designed order.
// Auto-inserts default attendance/guestDetails blocks for backward compatibility.
import React, { useMemo, useRef, useState } from "react";
import type { RsvpDesign, RsvpBlock } from "../../../../types/rsvpDesign";
import type { FormFieldConfig } from "../../../../api/hooks/useFormFieldsApi";
import { FormField } from "../../../molecules/FormField";
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

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const GUEST_TYPES = ["Family", "Friend", "VIP", "Other"] as const;
const STATUS_OPTIONS = [
  { value: "Yes", label: "Yes, I'll be there", icon: "\u2713", activeClass: "border-emerald-400 bg-emerald-500/20 text-emerald-300" },
  { value: "No",  label: "Sorry, can't make it", icon: "\u2715", activeClass: "border-rose-400 bg-rose-500/20 text-rose-300" },
  { value: "Maybe", label: "Maybe / Tentative", icon: "~", activeClass: "border-amber-400 bg-amber-500/20 text-amber-300" },
] as const;

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
  } = design;

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
        showFields: { name: true, email: true, phone: true, pax: true, guestType: true },
      });
    }
    return result;
  }, [rawBlocks]);

  // ── Core fields ──────────────────────────────────────────────────────────
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [status, setStatus] = useState<"Yes" | "No" | "Maybe" | null>(null);
  const [guestType, setGuestType] = useState<string>("Family");
  const [noOfPax, setNoOfPax] = useState<number>(1);
  const [phoneNo, setPhoneNo] = useState("");

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
      name: true, email: true, phone: true, pax: true, guestType: true,
    };

    if (showFields.name !== false && !guestName.trim()) errs.guestName = "Name is required";
    if (showFields.email !== false) {
      if (!guestEmail.trim()) errs.guestEmail = "Email is required";
      else if (!isValidEmail(guestEmail)) errs.guestEmail = "Enter a valid email address";
    }
    if (!status) errs.status = "Please select an attendance option";
    if (showFields.phone !== false && !phoneNo.trim()) errs.phoneNo = "Phone number is required";
    if (showFields.pax !== false && (!noOfPax || noOfPax < 1)) errs.noOfPax = "Please enter the number of guests";

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
      guestEmail: guestEmail.trim(),
      status: status!,
      guestType,
      noOfPax,
      phoneNo: phoneNo.trim(),
      answers,
    });
  };

  // ── Render a single design block ──────────────────────────────────────
  const renderBlock = (block: RsvpBlock): React.ReactNode => {
    const bgImages = block.background?.images ?? [];
    const activeBg =
      bgImages.find((img) => img.id === block.background?.activeImageId) ??
      bgImages[0] ??
      block.sectionImage;
    const overlayStrength = block.background?.overlay ?? 0.35;

    const sectionStyle: React.CSSProperties = activeBg
      ? {
          backgroundImage: `linear-gradient(rgba(15,23,42,${overlayStrength}),rgba(15,23,42,${overlayStrength})),url(${activeBg.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: flowPreset === "parallax" ? "fixed" : "scroll",
        }
      : {};

    let inner: React.ReactNode = null;

    if (block.type === "headline") {
      inner = (
        <div className={`text-${block.align}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Welcome</p>
          <h2 className={`mt-1 text-4xl font-extrabold text-white drop-shadow ${block.accent}`}>
            {block.title}
          </h2>
          {block.subtitle && (
            <p className="mt-2 text-base text-white/80">{block.subtitle}</p>
          )}
        </div>
      );
    } else if (block.type === "text") {
      inner = (
        <p
          className={`leading-relaxed text-base ${block.muted ? "text-white/70" : "text-white"} ${
            block.width === "half" ? "md:max-w-[50%]" : "w-full"
          }`}
        >
          {block.body}
        </p>
      );
    } else if (block.type === "info") {
      inner = (
        <div className={`inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm ${block.accent}`}>
          <span className="font-semibold uppercase tracking-wide">{block.label}</span>
          <span className="opacity-80">{block.content}</span>
        </div>
      );
    } else if (block.type === "attendance") {
      inner = (
        <div className={`space-y-4 ${block.width === "half" ? "md:max-w-[50%]" : "w-full"}`}>
          <div>
            <p className="text-sm font-semibold text-white">
              {block.title || "Will you be attending?"}
              <span className="ml-1 text-rose-400">*</span>
            </p>
            {block.subtitle && (
              <p className="mt-0.5 text-xs text-white/60">{block.subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map(({ value, label, icon, activeClass }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setStatus(value); clearError("status"); }}
                className={`rounded-xl border-2 py-3 text-xs font-semibold transition ${
                  status === value
                    ? activeClass
                    : "border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10"
                }`}
              >
                <span className="block text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          {errors.status && (
            <p className="text-xs text-rose-400">{errors.status}</p>
          )}
        </div>
      );
    } else if (block.type === "guestDetails") {
      const show = block.showFields ?? { name: true, email: true, phone: true, pax: true, guestType: true };
      inner = (
        <div className={`space-y-4 ${block.width === "half" ? "md:max-w-[50%]" : "w-full"}`}>
          <div>
            <p className="text-sm font-semibold text-white">{block.title || "Your details"}</p>
            {block.subtitle && (
              <p className="mt-0.5 text-xs text-white/60">{block.subtitle}</p>
            )}
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm space-y-4 text-gray-900">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {show.name !== false && (
                <FormField
                  label="Your name"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); clearError("guestName"); }}
                  placeholder="Full name"
                  error={errors.guestName}
                />
              )}
              {show.email !== false && (
                <FormField
                  label="Email address"
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => { setGuestEmail(e.target.value); clearError("guestEmail"); }}
                  placeholder="you@example.com"
                  error={errors.guestEmail}
                />
              )}
              {show.phone !== false && (
                <FormField
                  label="Phone number"
                  type="text"
                  required
                  value={phoneNo}
                  onChange={(e) => { setPhoneNo(e.target.value); clearError("phoneNo"); }}
                  placeholder="+60 12-345 6789"
                  error={errors.phoneNo}
                />
              )}
              {show.pax !== false && (
                <FormField
                  label="Number of guests"
                  type="number"
                  required
                  value={String(noOfPax)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setNoOfPax(isNaN(val) ? 1 : Math.max(1, val));
                    clearError("noOfPax");
                  }}
                  placeholder="1"
                  error={errors.noOfPax}
                />
              )}
            </div>
            {show.guestType !== false && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">How do you know the couple?</p>
                <div className="flex flex-wrap gap-2">
                  {GUEST_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setGuestType(type)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        guestType === type
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else if (block.type === "formField") {
      if (!block.questionId) return null;
      const cfg = formFields.find((f) => (f.questionId ?? f.id) === block.questionId);

      // Resolve options and type from config (if available) or block itself
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
        <div className={block.width === "half" ? "md:max-w-[50%]" : "w-full"}>
          <div className="rounded-xl bg-white p-4 shadow-sm text-gray-900">
            {isCheckboxGroup ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {fieldLabel}
                  {fieldRequired && (
                    <span className="ml-1 text-rose-500">*</span>
                  )}
                </p>
                {opts!.map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkedValues.includes(opt)}
                      onChange={() => toggleCheckboxAnswer(block.questionId!, opt)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
                {errors[block.questionId] && (
                  <p className="text-xs text-rose-500">{errors[block.questionId]}</p>
                )}
              </div>
            ) : (
              <FormField
                label={fieldLabel}
                type={fieldType}
                options={opts}
                required={fieldRequired}
                placeholder={block.placeholder}
                hint={block.hint}
                value={(currentAnswer as string) ?? ""}
                onChange={(e) => setAnswer(block.questionId!, e.target.value)}
                error={errors[block.questionId]}
              />
            )}
          </div>
        </div>
      );
    } else if (block.type === "cta") {
      inner = (
        <div
          className={`flex ${
            block.align === "center" ? "justify-center" : block.align === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className="inline-block rounded-full px-8 py-3 text-sm font-semibold shadow-lg"
            style={{ background: accentColor, color: "#0f172a" }}
          >
            {block.label}
          </span>
        </div>
      );
    } else if (block.type === "image") {
      const active = block.images.find((img) => img.id === block.activeImageId) ?? block.images[0];
      const heightClass =
        block.height === "tall" ? "h-80" : block.height === "short" ? "h-48" : "h-64";
      inner = (
        <div className={`overflow-hidden rounded-2xl ${heightClass}`}>
          {active ? (
            <img
              src={active.src}
              alt={active.alt ?? ""}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
          {block.caption && (
            <p className="bg-black/40 px-4 py-2 text-xs text-white/80">{block.caption}</p>
          )}
        </div>
      );
    }

    if (!inner) return null;

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
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
          className={`relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 ${
            flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""
          }`}
        >
          {/* ── All blocks rendered inline in designed order ── */}
          {blocks.map((block) => renderBlock(block))}

          {/* ── Submit button ── */}
          <div className="flex justify-center pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-w-[220px] items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-xl transition hover:opacity-90 disabled:opacity-60"
              style={{ background: accentColor, color: "#0f172a" }}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Submitting..." : "Submit RSVP"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
