// src/components/pages/RSVPs/RsvpDesignV2Page.tsx
// RSVP Designer V2 — Full-screen builder.
// Same state / hooks / block types / save logic as V1 (RsvpDesignPage).
// Renders as a fixed full-screen overlay so it takes the whole tab.

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useEventContext } from "../../../context/EventContext";
import type { Event } from "../../../api/hooks/useEventsApi";
import { useFormFields, type FormFieldConfig } from "../../../api/hooks/useFormFieldsApi";
import { useRsvpDesign, useSaveRsvpDesign } from "../../../api/hooks/useRsvpDesignApi";
import { FullPagePreview } from "./RsvpDesignPage";
import { useUploadMedia, useDeleteMedia } from "../../../api/hooks/useMediaApi";
import type { RsvpBlock, RsvpDesign, FlowPreset } from "../../../types/rsvpDesign";
import {
  saveImageToCache,
  getImageFromCache,
  getCachedImagesByEvent,
  removeCachedImage,
  cleanupExpiredImages,
} from "../../../utils/designImageCache";
import { NoEventsState } from "../../molecules/NoEventsState";
import { PageLoader } from "../../atoms/PageLoader";
import { BlockEditor } from "./designer/BlockEditor";
import { GlobalSettingsPanel } from "./designer/GlobalSettingsPanel";
import { Spinner } from "../../atoms/Spinner";

// ─── helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

/** Returns true if a src value is a usable image URL (not a stale blob or bare UUID). */
const isValidSrc = (src?: string | null): src is string =>
  !!src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:") || src.startsWith("/"));

/** Returns true when the hex background is perceptually light (needs dark text). */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

// ─── Block library ────────────────────────────────────────────────────────────

const CONTENT_BLOCKS: { type: RsvpBlock["type"]; icon: string; label: string; desc: string }[] = [
  { type: "headline",     icon: "Hₜ", label: "Headline",      desc: "Title & subtitle banner" },
  { type: "text",         icon: "¶",  label: "Text",          desc: "Body paragraph" },
  { type: "info",         icon: "ⓘ",  label: "Info badge",    desc: "Pill with label & value" },
  // { type: "attendance",   icon: "✓",  label: "Attendance",    desc: "Yes / No / Maybe picker" }, // hidden — not in use
  { type: "guestDetails", icon: "👤", label: "Guest details", desc: "Name · phone · pax" },
  { type: "formField",    icon: "✎",  label: "Form field",    desc: "Linked RSVP question" },
  { type: "cta",          icon: "→",  label: "CTA button",    desc: "Call-to-action button" },
  { type: "image",        icon: "🖼", label: "Image",         desc: "Photo or gallery block" },
];

const FROM_EVENT_BLOCKS: { type: RsvpBlock["type"]; icon: string; label: string; desc: string }[] = [
  { type: "eventDetails", icon: "📅", label: "Event Details", desc: "Date · time · location" },
  { type: "countdown",    icon: "⏳", label: "Countdown",     desc: "Live timer to event day" },
  { type: "map",          icon: "📍", label: "Map / Venue",   desc: "Location + directions" },
];

const BLOCK_TYPES = [...CONTENT_BLOCKS, ...FROM_EVENT_BLOCKS];

const BLOCK_LABEL: Record<string, string> = Object.fromEntries(
  BLOCK_TYPES.map(({ type, label }) => [type, label])
);

// ─── Countdown component (needs hooks, so it's a real FC) ────────────────────

function CountdownDisplay({
  targetDate,
  label,
  accentColor,
  headingColor,
  bodyColor,
}: {
  targetDate?: string;
  label?: string;
  accentColor: string;
  headingColor: string;
  bodyColor: string;
}) {
  const calcDiff = (isoDate?: string) => {
    if (!isoDate) return null;
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86_400_000),
      hrs:  Math.floor((diff % 86_400_000) / 3_600_000),
      min:  Math.floor((diff % 3_600_000)  / 60_000),
      sec:  Math.floor((diff % 60_000)     / 1_000),
    };
  };

  const [diff, setDiff] = useState(() => calcDiff(targetDate));
  useEffect(() => {
    const t = setInterval(() => setDiff(calcDiff(targetDate)), 1_000);
    return () => clearInterval(t);
  }, [targetDate]);

  const units = diff
    ? [
        { v: diff.days, u: "Days" },
        { v: diff.hrs,  u: "Hrs"  },
        { v: diff.min,  u: "Min"  },
        { v: diff.sec,  u: "Sec"  },
      ]
    : null;

  return (
    <div className="px-4 py-10 text-center">
      <p
        className="text-[10px] uppercase tracking-[0.28em] mb-6 font-semibold"
        style={{ color: accentColor }}
      >
        {label || "Counting down to our big day"}
      </p>
      {units ? (
        <div className="flex items-end justify-center gap-1.5 w-full">
          {units.map(({ v, u }, i) => (
            <React.Fragment key={u}>
              <div className="text-center flex-1 min-w-0">
                <div
                  className="font-bold leading-none"
                  style={{ fontFamily: "Georgia, serif", color: headingColor, fontSize: "2rem" }}
                >
                  {String(v).padStart(2, "0")}
                </div>
                <div
                  className="text-[9px] uppercase tracking-widest mt-1.5 font-semibold"
                  style={{ color: bodyColor, opacity: 0.55 }}
                >
                  {u}
                </div>
              </div>
              {i < 3 && (
                <div
                  className="text-xl pb-3 font-light shrink-0"
                  style={{ color: headingColor, opacity: 0.25 }}
                >
                  :
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <p className="text-lg font-semibold" style={{ color: headingColor }}>
          🎉 The big day is here!
        </p>
      )}
    </div>
  );
}

// ─── Canvas block renderer ────────────────────────────────────────────────────
// Blocks render as full-width page sections (not cards) so the canvas
// looks like the actual RSVP invite the guest will see.

function renderSectionContent(
  block: RsvpBlock,
  accentColor: string,
  isLight: boolean,
  event?: Event
): React.ReactNode {
  // Adaptive palette — flips between dark-on-light and light-on-dark
  const clr = {
    heading:    isLight ? "#1e293b" : "#ffffff",
    body:       isLight ? "#475569" : "rgba(255,255,255,0.75)",
    muted:      isLight ? "#94a3b8" : "rgba(255,255,255,0.45)",
    faint:      isLight ? "#cbd5e1" : "rgba(255,255,255,0.28)",
    pillBg:     isLight ? "rgba(0,0,0,0.06)"  : "rgba(255,255,255,0.08)",
    pillBorder: isLight ? "rgba(0,0,0,0.10)"  : "rgba(255,255,255,0.15)",
    inputBg:    isLight ? "rgba(0,0,0,0.04)"  : "rgba(255,255,255,0.06)",
    inputBdr:   isLight ? "rgba(0,0,0,0.12)"  : "rgba(255,255,255,0.12)",
    divider:    isLight ? "rgba(0,0,0,0.08)"  : "rgba(255,255,255,0.04)",
  };

  switch (block.type) {

    case "headline":
      return (
        <div
          className={`px-10 py-16 text-${block.align ?? "center"}`}
          style={{ fontFamily: block.fontFamily || "Georgia, 'Times New Roman', serif" }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.28em] mb-4 font-semibold"
            style={{ color: accentColor }}
          >
            Welcome
          </p>
          <h2
            className="text-[38px] font-normal leading-tight mb-3"
            style={{ color: clr.heading }}
          >
            {block.title || "Your Headline"}
          </h2>
          {block.subtitle && (
            <p className="text-sm leading-relaxed mt-2" style={{ color: clr.body }}>
              {block.subtitle}
            </p>
          )}
          <div
            className="w-14 h-px mx-auto mt-8"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)` }}
          />
        </div>
      );

    case "text":
      return (
        <div
          className={`px-10 py-8 text-${block.align ?? "left"}`}
          style={{ fontFamily: block.fontFamily || undefined }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{ color: block.muted ? clr.muted : clr.body }}
          >
            {block.body || "Add your text here…"}
          </p>
        </div>
      );

    case "info":
      return (
        <div className="px-10 py-7 flex justify-center">
          <div
            className="inline-flex items-center gap-3 rounded-full px-5 py-2.5 backdrop-blur-sm"
            style={{ background: clr.pillBg, border: `1px solid ${clr.pillBorder}` }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: clr.body }}
            >
              {block.label || "Highlight"}
            </span>
            <span className="w-px h-3 shrink-0" style={{ background: clr.pillBorder }} />
            <span className="text-[11px]" style={{ color: clr.muted }}>
              {block.content || "Value"}
            </span>
          </div>
        </div>
      );

    case "attendance":
      return (
        <div className="px-10 py-10">
          <p className="text-sm font-semibold mb-1" style={{ color: clr.heading }}>
            {block.title || "Will you be attending?"}
          </p>
          {block.subtitle && (
            <p className="text-xs mb-5" style={{ color: clr.muted }}>{block.subtitle}</p>
          )}
          {!block.subtitle && <div className="mb-5" />}
          <div className="flex gap-3">
            {["✓  Yes", "✗  No", "?  Maybe"].map((v) => (
              <div
                key={v}
                className="flex-1 text-center py-2.5 rounded-xl text-xs font-medium"
                style={{
                  background: clr.inputBg,
                  border: `1px solid ${clr.inputBdr}`,
                  color: clr.body,
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      );

    case "guestDetails": {
      const fields = block.showFields ?? { name: true, phone: true, pax: true };
      const visible = Object.entries(fields)
        .filter(([, v]) => v !== false)
        .map(([k]) => k);
      return (
        <div className="px-10 py-10">
          <p className="text-sm font-semibold mb-1" style={{ color: clr.heading }}>
            {block.title || "Guest Information"}
          </p>
          {block.subtitle && (
            <p className="text-xs mb-5" style={{ color: clr.muted }}>{block.subtitle}</p>
          )}
          {!block.subtitle && <div className="mb-5" />}
          <div className="space-y-2.5">
            {visible.map((f) => (
              <div
                key={f}
                className="rounded-xl px-4 py-3 text-xs capitalize"
                style={{
                  background: clr.inputBg,
                  border: `1px solid ${clr.inputBdr}`,
                  color: clr.faint,
                }}
              >
                {f === "pax" ? "Number of guests" : f}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "formField":
      return (
        <div className="px-10 py-7">
          <label
            className="block text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: clr.muted }}
          >
            {block.label || "Field"}
            {block.required && <span className="ml-1 text-rose-400">*</span>}
          </label>
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{
              background: clr.inputBg,
              border: `1px solid ${clr.inputBdr}`,
              color: clr.faint,
            }}
          >
            {block.placeholder || "Guest response here…"}
          </div>
          {block.hint && (
            <p className="text-[10px] mt-1.5" style={{ color: clr.faint }}>{block.hint}</p>
          )}
        </div>
      );

    case "cta":
      return (
        <div
          className={`px-10 py-10 flex ${
            block.align === "center"
              ? "justify-center"
              : block.align === "right"
              ? "justify-end"
              : "justify-start"
          }`}
        >
          <button
            className="rounded-full px-8 py-3 text-sm font-semibold shadow-lg pointer-events-none"
            style={{
              background: (block as any).ctaColor || accentColor,
              color: (block as any).ctaTextColor || "#fff",
            }}
          >
            {block.label || "Submit RSVP"}
          </button>
        </div>
      );

    case "image": {
      const active =
        block.images?.find((img) => img.id === block.activeImageId) ??
        block.images?.[0];
      const ratio =
        block.height === "tall" ? "4 / 3" : block.height === "short" ? "16 / 5" : "16 / 7";
      return (
        <div style={{ aspectRatio: ratio }}>
          {isValidSrc(active?.src) ? (
            <img src={active.src} alt={active.alt ?? ""} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ background: clr.inputBg }}
            >
              <span className="text-3xl" style={{ opacity: 0.2 }}>🖼</span>
              <span className="text-xs" style={{ color: clr.faint }}>Upload an image</span>
            </div>
          )}
        </div>
      );
    }

    // ── V2 event-linked blocks ──────────────────────────────────────────────

    case "eventDetails": {
      const showDate     = block.showDate     ?? true;
      const showTime     = block.showTime     ?? true;
      const showLocation = block.showLocation ?? true;

      // Format date nicely, fall back to raw string
      const rawDate = event?.date ?? event?.raw?.eventDate;
      const formattedDate = rawDate
        ? (() => { try { return new Date(rawDate).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch { return rawDate; } })()
        : "Date TBC";

      const rawTime = event?.raw?.eventTime ?? "";
      const formattedTime = rawTime || "Time TBC";
      const location = event?.location ?? event?.raw?.eventLocation ?? "Venue TBC";

      const detailCards = [
        showDate     && { icon: "📅", label: "Date",     value: formattedDate },
        showTime     && { icon: "⏰", label: "Time",     value: formattedTime },
        showLocation && { icon: "📍", label: "Venue",    value: location },
      ].filter(Boolean) as { icon: string; label: string; value: string }[];

      return (
        <div className="px-8 py-12 text-center">
          {block.title && (
            <p className="text-sm font-semibold mb-6" style={{ color: clr.body }}>
              {block.title}
            </p>
          )}
          <div className={`flex gap-3 justify-center flex-wrap`}>
            {detailCards.map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex-1 min-w-[90px] max-w-[160px] rounded-2xl px-4 py-5"
                style={{ background: clr.pillBg, border: `1px solid ${clr.pillBorder}` }}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div
                  className="text-[9px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: accentColor }}
                >
                  {label}
                </div>
                <div className="text-xs font-semibold leading-snug" style={{ color: clr.heading }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "countdown": {
      const targetDate = block.targetDate ?? event?.date ?? event?.raw?.eventDate;
      return (
        <CountdownDisplay
          targetDate={targetDate}
          label={block.label}
          accentColor={accentColor}
          headingColor={clr.heading}
          bodyColor={clr.body}
        />
      );
    }

    case "map": {
      const address = block.address ?? event?.location ?? event?.raw?.eventLocation ?? "";
      const mapLabel = block.mapLabel ?? "Venue";
      const showDirections = block.showDirections ?? true;
      const hasAddress = !!address;
      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=en`;

      return (
        <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 7" }}>
          {hasAddress ? (
            /* Real embedded map — pointer-events:none keeps canvas clicks on the block */
            <iframe
              title="Venue map"
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ pointerEvents: "none" }}
            />
          ) : (
            /* Placeholder when no address set yet */
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: isLight ? "#e8ebe0" : "#1a2035" }}
            >
              <span className="text-3xl opacity-30">📍</span>
              <p className="text-xs text-center px-6" style={{ color: clr.muted }}>
                Add an address in the block settings to show a live map
              </p>
            </div>
          )}
          {/* Bottom overlay card */}
          {hasAddress && (
            <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none">
              <div
                className="rounded-xl px-4 py-2 text-center shadow-lg"
                style={{ background: isLight ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.85)", border: `1px solid ${clr.pillBorder}` }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accentColor }}>
                  {mapLabel}
                </p>
                <p className="text-xs font-semibold" style={{ color: clr.heading }}>{address}</p>
              </div>
              {showDirections && (
                <span className="text-[10px] font-semibold underline" style={{ color: accentColor }}>
                  Get Directions →
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Canvas block wrapper ─────────────────────────────────────────────────────
// Handles hover/selection borders + label badge + action bar (mockup style).

function CanvasBlock({
  block,
  isSelected,
  accentColor,
  globalIsLight,
  event,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  block: RsvpBlock;
  isSelected: boolean;
  accentColor: string;
  globalIsLight: boolean;
  event?: Event;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  // Per-block section background (if present, treat as dark)
  const sectionImg =
    block.background?.images?.find(
      (img) => img.id === block.background?.activeImageId
    ) ??
    block.background?.images?.[0] ??
    block.sectionImage;
  const overlay = block.background?.overlay ?? 0.4;
  // If block has its own section image, it's always dark (overlay applied)
  const isLight = sectionImg ? false : globalIsLight;

  return (
    <div
      className="relative group cursor-pointer"
      style={
        sectionImg?.src
          ? {
              backgroundImage: `linear-gradient(rgba(15,23,42,${overlay}),rgba(15,23,42,${overlay})), url(${sectionImg.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
      onClick={onSelect}
    >
      {/* Selection border overlay */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none z-10" />
      )}
      {/* Hover dashed border (only when not selected) */}
      {!isSelected && (
        <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-primary/30 pointer-events-none z-10 transition-colors" />
      )}

      {/* Block label badge (selected) */}
      {isSelected && (
        <div
          className="absolute z-20 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider rounded-t"
          style={{
            top: -22,
            left: 0,
            background: "var(--color-primary, #6366f1)",
          }}
        >
          {BLOCK_LABEL[block.type] ?? block.type}
        </div>
      )}

      {/* Action bar (selected) */}
      {isSelected && (
        <div
          className="absolute z-20 flex bg-white border border-gray-200 shadow-md rounded-t overflow-hidden"
          style={{ top: -22, right: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: "↑", title: "Move up",    fn: onMoveUp },
            { label: "↓", title: "Move down",  fn: onMoveDown },
            { label: "✕", title: "Remove",     fn: onRemove },
          ].map(({ label, title, fn }, i, arr) => (
            <button
              key={label}
              title={title}
              onClick={fn}
              className={`px-2.5 py-0.5 text-[11px] text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition ${
                i < arr.length - 1 ? "border-r border-gray-100" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div>
        {renderSectionContent(block, accentColor, isLight, event)}
      </div>

      {/* Subtle section divider */}
      <div className="h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

// ─── Left panel – block list item ─────────────────────────────────────────────

function BlockItem({
  icon,
  label,
  desc,
  onAdd,
}: {
  icon: string;
  label: string;
  desc: string;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left border border-transparent hover:bg-[#fff5f7] hover:border-rose-100 group transition-all mb-0.5"
    >
      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0 group-hover:bg-[#fce4e9] transition">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-gray-600 group-hover:text-[#c0415a] leading-tight truncate">
          {label}
        </p>
        <p className="text-[10px] text-gray-400 truncate">{desc}</p>
      </div>
      <span aria-hidden="true" className="ml-auto text-gray-300 group-hover:text-rose-300 text-xs shrink-0">+</span>
    </button>
  );
}

// ─── Left panel – layer row ───────────────────────────────────────────────────

function LayerRow({
  block,
  index,
  isSelected,
  isDragging,
  accentColor,
  onSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  block: RsvpBlock;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  accentColor: string;
  onSelect: () => void;
  onDragStart: React.DragEventHandler;
  onDragOver: React.DragEventHandler;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer border transition-all select-none group mb-0.5 ${
        isSelected
          ? "border-rose-200 bg-rose-50"
          : isDragging
          ? "border-dashed border-gray-300 bg-gray-50 opacity-50"
          : "border-transparent hover:border-gray-100 hover:bg-gray-50"
      }`}
    >
      <span className="text-gray-300 text-xs cursor-grab active:cursor-grabbing shrink-0">
        ⠿
      </span>
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ background: accentColor }}
      >
        {BLOCK_TYPES.find((b) => b.type === block.type)?.icon ??
          block.type[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[12px] font-semibold truncate leading-tight ${
            isSelected ? "text-[#c0415a]" : "text-gray-600"
          }`}
        >
          {BLOCK_LABEL[block.type] ?? block.type}
        </p>
        <p className="text-[10px] text-gray-400">#{index + 1}</p>
      </div>
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onMoveUp}
          title="Move up"
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 text-xs transition"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          title="Move down"
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 text-xs transition"
        >
          ↓
        </button>
        <button
          onClick={onRemove}
          title="Remove"
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-rose-50 hover:text-rose-500 text-xs transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RsvpDesignV2Page() {
  const { event, eventId, eventsLoading } = useEventContext() ?? {};

  const { data: serverFormFields = [] } =
    useFormFields(eventId, { enabled: !!eventId });
  const { data: savedDesign, isLoading: isLoadingDesign } = useRsvpDesign(
    eventId ?? ""
  );
  const {
    mutateAsync: saveDesignAsync,
    isPending: isSaving,
    isSuccess: isSaveSuccess,
    data: saveResponse,
  } = useSaveRsvpDesign(eventId ?? "");
  const { mutateAsync: uploadMedia } = useUploadMedia();
  const { mutateAsync: deleteMedia } = useDeleteMedia();

  // ── Design state (identical to V1 / RsvpDesignPage) ─────────────────────
  const [isDesignLoaded, setIsDesignLoaded] = useState(false);
  const [blocks, setBlocks] = useState<RsvpBlock[]>([
    {
      id: uid(), type: "headline",
      title: "Welcome to our wedding",
      subtitle: "Save the date and RSVP below",
      align: "center", accent: "text-white",
      background: { images: [], overlay: 0.4 },
    },
    {
      id: uid(), type: "guestDetails",
      title: "Your details",
      subtitle: "Tell us about yourself",
      showFields: { name: true, phone: true, pax: true, remarks: true },
      background: { images: [], overlay: 0.4 },
    },
    {
      id: uid(), type: "cta",
      label: "Submit RSVP", href: "#", align: "center",
      background: { images: [], overlay: 0.4 },
    },
  ]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [globalBackgroundType, setGlobalBackgroundType]   = useState<"color" | "image" | "video">("color");
  const [globalBackgroundAsset, setGlobalBackgroundAsset] = useState("");
  const [globalBackgroundColor, setGlobalBackgroundColor] = useState("#0f172a");
  const [globalOverlay, setGlobalOverlay]         = useState(0.35);
  const [accentColor, setAccentColor]             = useState("#f97316");
  const [flowPreset, setFlowPreset]               = useState<FlowPreset>("serene");
  const [globalMusicUrl, setGlobalMusicUrl]       = useState("");
  const [submitButtonColor, setSubmitButtonColor]         = useState("");
  const [submitButtonTextColor, setSubmitButtonTextColor] = useState("");
  const [submitButtonLabel, setSubmitButtonLabel]         = useState("");
  const [globalFontFamily, setGlobalFontFamily]           = useState("");
  const [version, setVersion]         = useState<number | undefined>(undefined);

  // ── V2 UI state ──────────────────────────────────────────────────────────
  const [leftTab, setLeftTab]       = useState<"blocks" | "layers">("blocks");
  const [rightTab, setRightTab]     = useState<"block" | "page">("block");
  const [canvasMode, setCanvasMode] = useState<"mobile" | "desktop">("mobile");
  const [contentOpen, setContentOpen]     = useState(true);
  const [fromEventOpen, setFromEventOpen] = useState(true);
  const [presetsOpen, setPresetsOpen]     = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [isUploadingForSave, setIsUploadingForSave] = useState(false);
  // Tracks the cache ID of a pending global background image (blob URL not yet on CDN).
  const globalBgCacheIdRef = useRef<string | null>(null);

  const availableQuestions = useMemo<FormFieldConfig[]>(
    () => serverFormFields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [serverFormFields]
  );

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedId) ?? null,
    [blocks, selectedId]
  );

  // Sweep stale cache entries on mount (silent background cleanup)
  useEffect(() => { cleanupExpiredImages(7).catch(() => {}); }, []);

  // Sync version from save response
  useEffect(() => {
    if (saveResponse?.data?.version !== undefined)
      setVersion(saveResponse.data.version);
  }, [saveResponse]);

  // Load saved design (once)
  useEffect(() => {
    if (isLoadingDesign || isDesignLoaded) return;
    if (savedDesign?.blocks?.length) {
      const loaded = sanitizeBlocks(savedDesign.blocks);
      setBlocks(loaded);

      // Restore any block images that are still in the local cache
      // (e.g., a previous session uploaded some but not all images before refresh).
      if (eventId) {
        getCachedImagesByEvent(eventId)
          .then((cached) => {
            if (!cached.length) return;
            const cacheMap = new Map(cached.map((c) => [c.id, c]));
            setBlocks((prev) => {
              let changed = false;
              const next = prev.map((b) => {
                const patchedSectionImage =
                  b.sectionImage && !b.sectionImage.src && cacheMap.has(b.sectionImage.id)
                    ? { ...b.sectionImage, src: URL.createObjectURL(cacheMap.get(b.sectionImage.id)!.file) }
                    : b.sectionImage;
                const patchedBgImages = b.background?.images.map((img) =>
                  !img.src && cacheMap.has(img.id)
                    ? { ...img, src: URL.createObjectURL(cacheMap.get(img.id)!.file) }
                    : img
                ) ?? [];
                const patchedImages =
                  b.type === "image"
                    ? b.images.map((img) =>
                        !img.src && cacheMap.has(img.id)
                          ? { ...img, src: URL.createObjectURL(cacheMap.get(img.id)!.file) }
                          : img
                      )
                    : undefined;
                const didChange =
                  patchedSectionImage !== b.sectionImage ||
                  patchedBgImages.some((img, i) => img !== b.background?.images[i]) ||
                  (patchedImages && patchedImages.some((img, i) => img !== (b as any).images?.[i]));
                if (didChange) changed = true;
                return {
                  ...b,
                  sectionImage: patchedSectionImage,
                  background: b.background ? { ...b.background, images: patchedBgImages } : b.background,
                  ...(patchedImages ? { images: patchedImages } : {}),
                } as RsvpBlock;
              });
              return changed ? next : prev;
            });
          })
          .catch(() => {});
      }
      if (savedDesign.globalBackgroundType)  setGlobalBackgroundType(savedDesign.globalBackgroundType);
      if (savedDesign.globalBackgroundAsset && !isBlob(savedDesign.globalBackgroundAsset)) setGlobalBackgroundAsset(savedDesign.globalBackgroundAsset);
      if (savedDesign.globalBackgroundColor) setGlobalBackgroundColor(savedDesign.globalBackgroundColor);
      if (savedDesign.globalOverlay !== undefined) setGlobalOverlay(savedDesign.globalOverlay);
      if (savedDesign.accentColor)        setAccentColor(savedDesign.accentColor);
      if (savedDesign.flowPreset)         setFlowPreset(savedDesign.flowPreset);
      if (savedDesign.globalMusicUrl)     setGlobalMusicUrl(savedDesign.globalMusicUrl);
      if (savedDesign.submitButtonColor)  setSubmitButtonColor(savedDesign.submitButtonColor);
      if (savedDesign.submitButtonTextColor) setSubmitButtonTextColor(savedDesign.submitButtonTextColor);
      if (savedDesign.submitButtonLabel)  setSubmitButtonLabel(savedDesign.submitButtonLabel);
      if (savedDesign.globalFontFamily)   setGlobalFontFamily(savedDesign.globalFontFamily);
      if (savedDesign.version !== undefined) setVersion(savedDesign.version);
    } else if (event?.title) {
      // No saved design yet — seed the headline block with real event data
      toast("No RSVP design has been created for this event yet. Start building one below!", { icon: "ℹ️" });
      const parts: string[] = [];
      if (event.date) {
        try {
          parts.push(new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
        } catch {
          parts.push(event.date);
        }
      }
      if (event.time) parts.push(event.time);
      if (event.location) parts.push(event.location);
      const subtitle = parts.length > 0 ? `Save the date — ${parts.join(" · ")}` : "Save the date and RSVP below";
      setBlocks((prev) =>
        prev.map((b) =>
          b.type === "headline" ? { ...b, title: event.title, subtitle } : b
        )
      );
    }
    setIsDesignLoaded(true);
  }, [isLoadingDesign, savedDesign, isDesignLoaded, event?.title]);

  // ── Inject Google Fonts for the block font picker ─────────────────────────
  useEffect(() => {
    const id = "rsvp-designer-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Cormorant+Garamond:wght@400;600&family=Lato:wght@400;700&family=Montserrat:wght@400;600&display=swap";
    document.head.appendChild(link);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isBlob = (url: string) => url.startsWith("blob:");

  // Strip blob URLs from blocks before saving/loading — blobs are session-only
  // and become invalid after page reload, causing ERR_FILE_NOT_FOUND in preview.
  const sanitizeBlocks = (rawBlocks: RsvpBlock[]): RsvpBlock[] =>
    rawBlocks.map((b) => ({
      ...b,
      sectionImage: b.sectionImage
        ? { ...b.sectionImage, src: isBlob(b.sectionImage.src) ? "" : b.sectionImage.src }
        : b.sectionImage,
      background: b.background
        ? { ...b.background, images: b.background.images.map((img) => ({ ...img, src: isBlob(img.src) ? "" : img.src })) }
        : b.background,
      ...(b.type === "image"
        ? { images: b.images.map((img) => ({ ...img, src: isBlob(img.src) ? "" : img.src })) }
        : {}),
    })) as RsvpBlock[];

  // Creates an image asset entry: saves the file to IndexedDB and returns a blob URL
  // for immediate preview. The file is uploaded to CDN only when Save Design is clicked.
  const toImageAsset = async (file: File) => {
    const id = uid();
    const blobUrl = await saveImageToCache(id, file, eventId ?? "");
    return { id, src: blobUrl, alt: file.name };
  };


  // ── Block operations ─────────────────────────────────────────────────────
  const addBlock = (type: RsvpBlock["type"]) => {
    const id = uid();
    const defaults: Record<RsvpBlock["type"], RsvpBlock> = {
      headline:     { id, type: "headline",     title: "Custom headline",    subtitle: "Add a subheader", align: "center", accent: "text-white", background: { images: [], overlay: 0.4 } },
      text:         { id, type: "text",         body: "Tell your guests what to expect.", width: "full", align: "left", muted: false, background: { images: [], overlay: 0.4 } },
      info:         { id, type: "info",         label: "Highlight", content: "Dress code, parking, or venue info", accent: "bg-white/20 text-white border border-white/30", background: { images: [], overlay: 0.4 } },
      attendance:   { id, type: "attendance",   title: "Will you be attending?", subtitle: "Please let us know", background: { images: [], overlay: 0.4 } },
      guestDetails: { id, type: "guestDetails", title: "Guest Information", subtitle: "", showFields: { name: true, phone: true, pax: true, remarks: true }, background: { images: [], overlay: 0.4 } },
      formField:    { id, type: "formField",    label: "Custom field", placeholder: "Placeholder", required: false, width: "full", background: { images: [], overlay: 0.4 } },
      cta:          { id, type: "cta",          label: "Submit RSVP", href: "#", align: "center", background: { images: [], overlay: 0.4 } },
      image:        { id, type: "image",        images: [], activeImageId: undefined, caption: "Add a caption", height: "medium", background: { images: [], overlay: 0.4 } },
      eventDetails: { id, type: "eventDetails", showDate: true, showTime: true, showLocation: true, background: { images: [], overlay: 0.4 } },
      countdown:    { id, type: "countdown",    background: { images: [], overlay: 0.4 } },
      map:          { id, type: "map",          showDirections: true, background: { images: [], overlay: 0.4 } },
    };
    setBlocks((prev) => [...prev, defaults[type]]);
    setSelectedId(id);
    setLeftTab("layers");
    setRightTab("block");
  };

  // Inserts guestDetails + remarks + event questions + cta as a preset group
  const addRsvpFormPreset = () => {
    const g = uid(), r = uid(), c = uid();
    const questionBlocks = availableQuestions.map((field) => ({
      id: uid(),
      type: "formField" as const,
      label: field.label || (field as any).text || "Custom field",
      placeholder: Array.isArray(field.options) ? String(field.options[0] ?? "") : "",
      required: field.isRequired ?? false,
      width: "full" as const,
      hint: undefined,
      questionId: String(field.id ?? (field as any).questionId ?? ""),
      background: { images: [], overlay: 0.4 },
    }));
    setBlocks((prev) => [
      ...prev,
      { id: g, type: "guestDetails", title: "Guest Information",      subtitle: "", showFields: { name: true, phone: true, pax: true, remarks: true }, background: { images: [], overlay: 0.4 } },
      { id: r, type: "formField",    label: "Remarks", placeholder: "Any notes or special requests…", required: false, width: "full", background: { images: [], overlay: 0.4 } },
      ...questionBlocks,
      { id: c, type: "cta",          label: "Submit RSVP",            href: "#", align: "center",          background: { images: [], overlay: 0.4 } },
    ]);
    setSelectedId(c);
    setLeftTab("layers");
    setRightTab("block");
  };

  const updateBlock = (blockId: string, patch: Partial<RsvpBlock>) =>
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? ({ ...b, ...patch } as RsvpBlock) : b))
    );

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedId === blockId) setSelectedId(null);
  };

  const moveBlock = (id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      if (i === -1) return prev;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const reorderBlocks = (sourceId: string, targetId: string) => {
    const si = blocks.findIndex((b) => b.id === sourceId);
    const ti = blocks.findIndex((b) => b.id === targetId);
    if (si === -1 || ti === -1 || si === ti) return;
    const next = [...blocks];
    const [moved] = next.splice(si, 1);
    next.splice(ti, 0, moved);
    setBlocks(next);
  };


  const applyQuestionToBlock = (blockId: string, questionId: string | undefined) => {
    if (!questionId) return;
    const field = availableQuestions.find(
      (f) => String(f.id ?? f.questionId) === String(questionId)
    );
    if (!field) return;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "formField") return b;
        return {
          ...b,
          label: field.label || field.text || b.label,
          placeholder: Array.isArray(field.options) ? String(field.options[0] ?? "") : b.placeholder ?? "",
          required: field.isRequired ?? b.required ?? false,
          hint: field.typeKey ? `${field.typeKey}${field.isRequired ? " · required" : ""}` : b.hint,
          questionId,
        } as RsvpBlock;
      })
    );
  };

  // ── Image operations ──────────────────────────────────────────────────────
  const handleBackgroundUpload = async (file: File) => {
    const id = uid();
    const blobUrl = await saveImageToCache(id, file, eventId ?? "");
    // If the current background is a saved CDN URL, delete the old file from CDN
    if (globalBackgroundAsset?.startsWith("https://")) {
      const fileName = globalBackgroundAsset.split("/").pop();
      if (fileName) deleteMedia({ fileName }).catch(() => {});
    }
    // Evict any previous pending global background from cache
    if (globalBgCacheIdRef.current) {
      removeCachedImage(globalBgCacheIdRef.current).catch(() => {});
    }
    globalBgCacheIdRef.current = id;
    setGlobalBackgroundAsset(blobUrl);
  };

  const handleImageUploadBlock = async (files: FileList) => {
    const gallery = await Promise.all(Array.from(files).map(toImageAsset));
    const block: RsvpBlock = {
      id: uid(), type: "image",
      images: gallery, activeImageId: gallery[0]?.id,
      caption: "Add a caption or blessing", height: "medium",
      background: { images: [], overlay: 0.4 },
    };
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
  };

  const addBackgroundImagesToBlock = async (blockId: string, files: FileList) => {
    const gallery = await Promise.all(Array.from(files).map(toImageAsset));
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const existing = b.background?.images ?? [];
        const merged = [...existing, ...gallery];
        return {
          ...b,
          background: {
            images: merged,
            activeImageId: b.background?.activeImageId ?? merged[0]?.id,
            overlay: b.background?.overlay ?? 0.4,
          },
        } as RsvpBlock;
      })
    );
  };

  const setActiveBackgroundForBlock = (blockId: string, imageId: string) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? ({ ...b, background: { ...(b.background ?? { images: [] }), activeImageId: imageId } } as RsvpBlock)
          : b
      )
    );

  const removeBackgroundImageFromBlock = (blockId: string, imageId: string) =>
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const remaining = (b.background?.images ?? []).filter((img) => img.id !== imageId);
        return {
          ...b,
          background: {
            images: remaining,
            activeImageId:
              b.background?.activeImageId === imageId ? remaining[0]?.id : b.background?.activeImageId,
            overlay: b.background?.overlay ?? 0.4,
          },
        } as RsvpBlock;
      })
    );

  const setOverlayForBlock = (blockId: string, overlay: number) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? ({ ...b, background: { ...(b.background ?? { images: [] }), overlay } } as RsvpBlock)
          : b
      )
    );

  const setSectionImageForBlock = async (blockId: string, file: File) => {
    // Capture old section image before updating state for cleanup
    const oldSectionImage = blocks.find((b) => b.id === blockId)?.sectionImage;
    const asset = await toImageAsset(file);
    // Clean up old CDN file if this slot was already saved
    if (oldSectionImage) {
      if (oldSectionImage.src?.startsWith("https://")) {
        const fileName = oldSectionImage.src.split("/").pop();
        if (fileName) deleteMedia({ fileName }).catch(() => {});
      }
      // Clean up old IndexedDB entry for this slot (no-op if already cleared after last save)
      removeCachedImage(oldSectionImage.id).catch(() => {});
    }
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, sectionImage: asset } : b))
    );
  };

  const clearSectionImage = (blockId: string) =>
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, sectionImage: null } : b))
    );

  const replaceImageForBlock = async (blockId: string, file: File) => {
    const asset = await toImageAsset(file);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "image") return b;
        return { ...b, images: [asset, ...b.images], activeImageId: asset.id };
      })
    );
  };

  const appendImagesToBlock = async (blockId: string, files: FileList) => {
    const newAssets = await Promise.all(Array.from(files).map(toImageAsset));
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "image") return b;
        const nextImages = [...b.images, ...newAssets];
        return { ...b, images: nextImages, activeImageId: b.activeImageId ?? nextImages[0]?.id };
      })
    );
  };

  // ── Save / preview ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!eventId) return;
    setIsUploadingForSave(true);
    try {
      // --- Collect all block images that are still blobs (pending upload) ---
      const allBlobAssets: { id: string }[] = [];
      for (const b of blocks) {
        if (b.sectionImage && isBlob(b.sectionImage.src)) allBlobAssets.push(b.sectionImage);
        for (const img of b.background?.images ?? []) {
          if (isBlob(img.src)) allBlobAssets.push(img);
        }
        if (b.type === "image") {
          for (const img of b.images) {
            if (isBlob(img.src)) allBlobAssets.push(img);
          }
        }
      }

      // --- Upload each cached image; build id→cdnUrl swap map ---
      // Cache entries are NOT removed here — removal happens only after saveDesign confirms success.
      const urlSwaps: Record<string, string> = {};
      const uploadedCacheIds: string[] = [];
      await Promise.all(
        allBlobAssets.map(async ({ id }) => {
          const cached = await getImageFromCache(id);
          if (!cached) return;
          let result;
          try {
            result = await uploadMedia({ file: cached.file, eventGuid: eventId });
          } catch (err) {
            throw new Error(`Image upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
          }
          if (!isValidSrc(result?.url)) {
            throw new Error("Image upload returned an invalid URL.");
          }
          urlSwaps[id] = result.url;
          uploadedCacheIds.push(id);
        })
      );

      // --- Apply CDN URL swaps to blocks ---
      const swappedBlocks: RsvpBlock[] = blocks.map((b) => ({
        ...b,
        ...(b.sectionImage && urlSwaps[b.sectionImage.id]
          ? { sectionImage: { ...b.sectionImage, src: urlSwaps[b.sectionImage.id] } }
          : {}),
        background: b.background
          ? {
              ...b.background,
              images: b.background.images.map((img) =>
                urlSwaps[img.id] ? { ...img, src: urlSwaps[img.id] } : img
              ),
            }
          : b.background,
        ...(b.type === "image"
          ? { images: b.images.map((img) => (urlSwaps[img.id] ? { ...img, src: urlSwaps[img.id] } : img)) }
          : {}),
      })) as RsvpBlock[];

      // Update React state so UI immediately shows CDN URLs instead of blobs
      if (Object.keys(urlSwaps).length > 0) setBlocks(swappedBlocks);

      // --- Upload global background if it's still a cached blob ---
      let resolvedBgAsset = globalBackgroundAsset;
      let uploadedBgCacheId: string | null = null;
      if (isBlob(globalBackgroundAsset) && globalBgCacheIdRef.current) {
        const cached = await getImageFromCache(globalBgCacheIdRef.current);
        if (cached) {
          let result;
          try {
            result = await uploadMedia({ file: cached.file, eventGuid: eventId });
          } catch (err) {
            throw new Error(`Background image upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
          }
          if (!isValidSrc(result?.url)) {
            throw new Error("Background image upload returned an invalid URL.");
          }
          resolvedBgAsset = result.url;
          setGlobalBackgroundAsset(result.url);
          uploadedBgCacheId = globalBgCacheIdRef.current;
        }
      }

      // --- Persist design (awaited so cache cleanup only runs on confirmed success) ---
      const currentDesign: RsvpDesign = {
        blocks: sanitizeBlocks(swappedBlocks), flowPreset,
        globalBackgroundType, globalBackgroundAsset: isBlob(resolvedBgAsset) ? "" : resolvedBgAsset, globalBackgroundColor,
        globalOverlay, accentColor,
        globalMusicUrl: globalMusicUrl || undefined,
        submitButtonColor: submitButtonColor || undefined,
        submitButtonTextColor: submitButtonTextColor || undefined,
        submitButtonLabel: submitButtonLabel || undefined,
        globalFontFamily: globalFontFamily || undefined,
        formFieldConfigs: availableQuestions,
      };
      await saveDesignAsync({ design: currentDesign, isPublished: false, isDraft: true });

      // --- Cleanup cache only after save is confirmed ---
      await Promise.all(uploadedCacheIds.map((id) => removeCachedImage(id).catch(() => {})));
      if (uploadedBgCacheId) {
        await removeCachedImage(uploadedBgCacheId).catch(() => {});
        globalBgCacheIdRef.current = null;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save design. Please try again.");
    } finally {
      setIsUploadingForSave(false);
    }
  };

  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    setShowPreview(true);
  };

  // ── Early return ──────────────────────────────────────────────────────────
  if (eventsLoading) return <PageLoader message="Loading..." />;
  if (!eventId) {
    return (
      <NoEventsState
        title="No Event for RSVP Design"
        message="Create your first event to start customising your RSVP page."
      />
    );
  }

  // ── Canvas frame background style + light/dark detection ─────────────────
  const frameBg: React.CSSProperties =
    globalBackgroundType === "color"
      ? { background: globalBackgroundColor }
      : { background: "linear-gradient(to bottom, #0f172a, #020617)" };

  // Drive adaptive text colors in canvas blocks
  const globalIsLight =
    globalBackgroundType === "color" && isLightColor(globalBackgroundColor);

  // ─────────────────────────────────────────────────────────────────────────────
  // Full-screen builder — fixed overlay covering the entire viewport.
  // Opens in a new tab (see RsvpsPage link) so the dashboard is irrelevant.
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f0f2f5" }}
    >
      {/* ════════════════════════════════════════════════════════
          TOP TOOLBAR
      ════════════════════════════════════════════════════════ */}
      <header
        className="flex items-center gap-2 px-4 shrink-0 bg-white border-b border-gray-200"
        style={{ height: 52, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", zIndex: 10 }}
      >
        {/* Close tab */}
        <button
          onClick={() => window.close()}
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0 mr-1"
          title="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        {/* Event name */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-0.5">
            RSVP Designer V2
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
            {event?.title ?? "Untitled event"}
          </p>
        </div>

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        {/* Viewport toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
          {(["mobile", "desktop"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCanvasMode(m)}
              title={m}
              className={`rounded px-2.5 py-1.5 text-xs font-medium transition-all ${
                canvasMode === m
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "mobile" ? "📱" : "🖥"}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        {/* Status */}
        {isLoadingDesign && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Spinner /> Loading…
          </span>
        )}
        {isSaveSuccess && !isSaving && !isUploadingForSave && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
            ✓ Saved
          </span>
        )}
        {!isSaveSuccess && !isSaving && !isUploadingForSave && !isLoadingDesign && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-semibold">
            Draft
          </span>
        )}

        {/* Preview */}
        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md text-gray-600 hover:border-primary hover:text-primary transition bg-white"
        >
          Preview
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving || isUploadingForSave || isLoadingDesign}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
        >
          {isSaving || isUploadingForSave ? <><Spinner />&nbsp;Saving…</> : "Save design"}
        </button>
      </header>

      {/* ════════════════════════════════════════════════════════
          MAIN — left panel + canvas + right panel
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ──────────────────────────────────────────────────────
            LEFT PANEL
        ────────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col overflow-hidden bg-white border-r border-gray-100 shrink-0"
          style={{ width: 240 }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            {(["blocks", "layers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition border-b-2 ${
                  leftTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "layers" ? `Layers (${blocks.length})` : "Blocks"}
              </button>
            ))}
          </div>

          {/* Blocks tab */}
          {leftTab === "blocks" && (
            <div className="flex-1 overflow-y-auto p-2">
              {/* Content blocks */}
              <button
                type="button"
                onClick={() => setContentOpen((o) => !o)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 motion-safe:transition-colors duration-150 ease-out"
              >
                <span>Content</span>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 motion-safe:transition-transform duration-200 ${contentOpen ? "rotate-0" : "-rotate-90"}`}><polyline points="2 5 7 10 12 5" /></svg>
              </button>
              {contentOpen && CONTENT_BLOCKS.map(({ type, icon, label, desc }) => (
                <BlockItem key={type} icon={icon} label={label} desc={desc} onAdd={() => addBlock(type)} />
              ))}

              {/* Event-linked blocks */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setFromEventOpen((o) => !o)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 motion-safe:transition-colors duration-150 ease-out"
                >
                  <span>From event</span>
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 motion-safe:transition-transform duration-200 ${fromEventOpen ? "rotate-0" : "-rotate-90"}`}><polyline points="2 5 7 10 12 5" /></svg>
                </button>
                {fromEventOpen && FROM_EVENT_BLOCKS.map(({ type, icon, label, desc }) => (
                  <BlockItem key={type} icon={icon} label={label} desc={desc} onAdd={() => addBlock(type)} />
                ))}
              </div>

              {/* Presets */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setPresetsOpen((o) => !o)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 motion-safe:transition-colors duration-150 ease-out"
                >
                  <span>Presets</span>
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 motion-safe:transition-transform duration-200 ${presetsOpen ? "rotate-0" : "-rotate-90"}`}><polyline points="2 5 7 10 12 5" /></svg>
                </button>
                {presetsOpen && (
                  <>
                    <button
                      type="button"
                      onClick={addRsvpFormPreset}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left border border-dashed border-gray-200 hover:border-rose-200 hover:bg-rose-50 cursor-pointer group transition"
                    >
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0 group-hover:bg-rose-100 transition">
                        📋
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-500 group-hover:text-[#c0415a] leading-tight">RSVP Form</p>
                        <p className="text-[10px] text-gray-400">Adds guest details + questions + submit</p>
                      </div>
                    </button>

                    {/* Upload shortcut */}
                    <label className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left border border-dashed border-gray-200 hover:border-rose-200 hover:bg-rose-50 cursor-pointer group transition mt-1.5">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0 group-hover:bg-rose-100 transition">
                        📷
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-500 group-hover:text-[#c0415a] leading-tight">Upload image</p>
                        <p className="text-[10px] text-gray-400">Adds an image block</p>
                      </div>
                      <input
                        type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => e.target.files && handleImageUploadBlock(e.target.files)}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Layers tab */}
          {leftTab === "layers" && (
            <div className="flex-1 overflow-y-auto p-2">
              {blocks.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <p className="text-xs text-gray-400 mb-2">No blocks yet.</p>
                  <button
                    onClick={() => setLeftTab("blocks")}
                    className="text-xs font-semibold text-[#c0415a] hover:underline"
                  >
                    Add your first block →
                  </button>
                </div>
              ) : (
                blocks.map((block, i) => (
                  <LayerRow
                    key={block.id}
                    block={block} index={i}
                    isSelected={selectedId === block.id}
                    isDragging={draggingId === block.id}
                    accentColor={accentColor}
                    onSelect={() => { setSelectedId(block.id); setRightTab("block"); }}
                    onDragStart={(e) => {
                      setDraggingId(block.id);
                      e.dataTransfer.setData("text/plain", block.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingId && draggingId !== block.id) reorderBlocks(draggingId, block.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onMoveUp={() => moveBlock(block.id, "up")}
                    onMoveDown={() => moveBlock(block.id, "down")}
                    onRemove={() => removeBlock(block.id)}
                  />
                ))
              )}
            </div>
          )}
        </aside>

        {/* ──────────────────────────────────────────────────────
            CANVAS
        ────────────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "#eaecf0" }}
        >
        {/* Inner wrapper — NOT overflow, just layout. Scroll happens on <main>. */}
        <div
          className="p-6 flex flex-col items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {/* Canvas breadcrumb */}
          <div className="w-full max-w-2xl mb-3 flex items-center justify-between">
            <p className="text-[11px] text-gray-500">
              <span className="font-semibold text-gray-700">{blocks.length}</span>{" "}
              {blocks.length === 1 ? "block" : "blocks"}{" "}
              {selectedBlock && (
                <span className="text-primary font-semibold">
                  · editing <em className="not-italic">{BLOCK_LABEL[selectedBlock.type]}</em>
                </span>
              )}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              {canvasMode === "mobile" ? "📱 375 px" : "🖥 Desktop"}
            </p>
          </div>

          {/* Device frame */}
          <div
            className={`relative transition-all duration-300 overflow-hidden ${
              canvasMode === "mobile"
                ? "w-[375px] rounded-[28px] shadow-[0_0_0_8px_#1a1a2e,0_24px_64px_rgba(0,0,0,0.45)]"
                : "w-full max-w-2xl rounded-lg shadow-[0_4px_32px_rgba(0,0,0,0.22)]"
            }`}
            style={{ ...frameBg, minHeight: 700, fontFamily: globalFontFamily || "Georgia, 'Times New Roman', serif" }}
            onClick={(e) => {
              if (e.currentTarget === e.target) setSelectedId(null);
            }}
          >
            {/* Global background image layer */}
            {globalBackgroundType === "image" && globalBackgroundAsset && (
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url(${globalBackgroundAsset})` }}
              />
            )}
            {globalBackgroundType === "video" && globalBackgroundAsset && (
              <video
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                src={globalBackgroundAsset}
                autoPlay loop muted playsInline
              />
            )}
            {(globalBackgroundType === "image" || globalBackgroundType === "video") && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `rgba(15,23,42,${globalOverlay})` }}
              />
            )}

            {/* Blocks */}
            <div className="relative z-10">
              {blocks.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-28 gap-3"
                  style={{ color: globalIsLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}
                >
                  <span className="text-5xl">✦</span>
                  <p className="text-xs text-center leading-relaxed">
                    Add blocks from the left panel<br />to start building your RSVP page
                  </p>
                </div>
              )}
              {blocks.map((block) => (
                <CanvasBlock
                  key={block.id}
                  block={block} isSelected={selectedId === block.id}
                  accentColor={accentColor}
                  globalIsLight={globalIsLight}
                  event={event}
                  onSelect={() => { setSelectedId(block.id); setRightTab("block"); }}
                  onMoveUp={() => moveBlock(block.id, "up")}
                  onMoveDown={() => moveBlock(block.id, "down")}
                  onRemove={() => removeBlock(block.id)}
                />
              ))}

              {/* Drop zone at bottom */}
              {blocks.length > 0 && (
                <div className="mx-3 my-3">
                  <button
                    onClick={() => setLeftTab("blocks")}
                    className="w-full py-3 rounded-lg border border-dashed text-xs transition"
                    style={{
                      borderColor: globalIsLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
                      color: globalIsLight ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.30)",
                    }}
                  >
                    ＋ Add block
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>{/* end inner layout wrapper */}
        </main>

        {/* ──────────────────────────────────────────────────────
            RIGHT PANEL
        ────────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col overflow-hidden bg-white border-l border-gray-100 shrink-0"
          style={{ width: 360 }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            {(["block", "page"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition border-b-2 ${
                  rightTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "block" ? "Block" : "Page"}
              </button>
            ))}
          </div>

          {/* Block tab */}
          {rightTab === "block" && (
            <div className="flex-1 overflow-y-auto">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  accentColor={accentColor}
                  formFields={availableQuestions}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onAddBackgroundImages={addBackgroundImagesToBlock}
                  onSetActiveBackground={setActiveBackgroundForBlock}
                  onSetOverlay={setOverlayForBlock}
                  onRemoveBackgroundImage={removeBackgroundImageFromBlock}
                  onSetSectionImage={setSectionImageForBlock}
                  onClearSectionImage={clearSectionImage}
                  onReplaceImage={replaceImageForBlock}
                  onAppendImages={appendImagesToBlock}
                  onApplyQuestion={applyQuestionToBlock}
                />
              ) : (
                <div className="px-5 py-8 text-center">
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-lg"
                    style={{ background: "#f5f5f5" }}
                  >
                    ✦
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    No block selected
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Click any block in the canvas to edit its properties here.
                  </p>
                  <button
                    onClick={() => setRightTab("page")}
                    className="mt-4 text-xs font-semibold text-[#c0415a] hover:underline"
                  >
                    Edit page settings →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Page tab */}
          {rightTab === "page" && (
            <div className="flex-1 overflow-y-auto">
              <GlobalSettingsPanel
                globalBackgroundType={globalBackgroundType}
                globalBackgroundColor={globalBackgroundColor}
                globalOverlay={globalOverlay}
                accentColor={accentColor}
                flowPreset={flowPreset}
                globalMusicUrl={globalMusicUrl}
                submitButtonColor={submitButtonColor}
                submitButtonTextColor={submitButtonTextColor}
                submitButtonLabel={submitButtonLabel}
                globalFontFamily={globalFontFamily}
                hasBackgroundAsset={!!globalBackgroundAsset}
                onChange={(patch) => {
                  if (patch.globalBackgroundType !== undefined) setGlobalBackgroundType(patch.globalBackgroundType);
                  if (patch.globalBackgroundColor !== undefined) setGlobalBackgroundColor(patch.globalBackgroundColor);
                  if (patch.globalOverlay !== undefined) setGlobalOverlay(patch.globalOverlay);
                  if (patch.accentColor !== undefined) setAccentColor(patch.accentColor);
                  if (patch.flowPreset !== undefined) setFlowPreset(patch.flowPreset);
                  if (patch.globalMusicUrl !== undefined) setGlobalMusicUrl(patch.globalMusicUrl);
                  if (patch.submitButtonColor !== undefined) setSubmitButtonColor(patch.submitButtonColor);
                  if (patch.submitButtonTextColor !== undefined) setSubmitButtonTextColor(patch.submitButtonTextColor);
                  if (patch.submitButtonLabel !== undefined) setSubmitButtonLabel(patch.submitButtonLabel);
                  if (patch.globalFontFamily !== undefined) setGlobalFontFamily(patch.globalFontFamily);
                }}
                onUploadBackground={handleBackgroundUpload}
              />
            </div>
          )}
        </aside>
      </div>

      {/* ════════════════════════════════════════════════════════
          STATUS BAR
      ════════════════════════════════════════════════════════ */}
      <footer
        className="flex items-center px-4 gap-4 shrink-0 border-t border-gray-200"
        style={{ height: 26, background: "#f8f8fb", fontSize: 11, color: "#aaa" }}
      >
        <span>
          {blocks.length} block{blocks.length !== 1 ? "s" : ""}
        </span>
        <span className="w-px h-3 bg-gray-200" />
        <span>{event?.title ?? "No event"}</span>
        <span className="w-px h-3 bg-gray-200" />
        <span>RSVP Designer V2</span>
        <span className="ml-auto">
          {isSaving
            ? "Saving…"
            : isSaveSuccess
            ? "All changes saved"
            : "Unsaved changes"}
        </span>
      </footer>

      {/* Full-screen preview overlay — shows current in-memory state */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] overflow-auto">
          <button
            onClick={() => setShowPreview(false)}
            className="fixed top-4 right-4 z-[101] flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/80 transition"
          >
            ✕ Close Preview
          </button>
          <FullPagePreview
            blocks={blocks}
            backgroundColor={globalBackgroundColor}
            backgroundAsset={globalBackgroundAsset}
            backgroundType={globalBackgroundType}
            overlay={globalOverlay}
            accentColor={accentColor}
            flowPreset={flowPreset}
          />
        </div>
      )}
    </div>
  );
}
