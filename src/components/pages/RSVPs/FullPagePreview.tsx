// src/components/pages/RSVPs/FullPagePreview.tsx
//
// The full-page RSVP preview, lifted out of the retired V1 designer
// (RsvpDesignPage) so the live share-preview route no longer depends on dead
// editor code. V1 and V2 are excluded from the build - see tsconfig.app.json.
//
// Width: this renders the SAME width the guest actually gets, by reading
// contentWidthClass() from utils/rsvpContentWidths. That is the whole point -
// the share preview, the designer canvas and the public page must not drift.
// It accepts StoredContentWidth because designs saved before the change may
// still carry the retired "full"; normalizeContentWidth coerces it.
//
// Note: the mode argument on renderBlockPreview ("thumb" | "full") is a
// rendering DENSITY and has nothing to do with content width. Leave it.
import React from "react";
import type { RsvpBlock, FlowPreset } from "../../../types/rsvpDesign";
import { contentWidthClass, type StoredContentWidth } from "../../../utils/rsvpContentWidths";

function renderBlockPreview(block: RsvpBlock, accentColor: string, mode: "thumb" | "full" = "thumb"): React.ReactNode {
  switch (block.type) {
    case "headline":
      return (
        <div className={`text-${block.align}`}>
          <p className={`uppercase tracking-[0.2em] text-white/70 ${mode === "full" ? "text-xs" : "text-xs"}`}>Welcome</p>
          <h2 className={`mt-0.5 font-extrabold text-white drop-shadow ${block.accent} ${mode === "full" ? "text-4xl" : "text-2xl"}`}>{block.title}</h2>
          {block.subtitle && <p className={`mt-1 text-white/75 ${mode === "full" ? "text-base" : "text-xs"}`}>{block.subtitle}</p>}
        </div>
      );
    case "text":
      return (
        <p
          className={`leading-relaxed ${block.muted ? "text-white/70" : "text-white"} ${
            mode === "full"
              ? `text-base ${block.width === "half" ? "md:max-w-[50%]" : "w-full"}`
              : "text-sm"
          }`}
        >
          {block.body}
        </p>
      );
    case "info":
      return (
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${block.accent} ${mode === "full" ? "text-sm gap-3 px-5 py-2.5" : "text-xs"}`}>
          <span className="font-semibold uppercase tracking-wide">{block.label}</span>
          <span className="text-white/80">{block.content}</span>
        </div>
      );
    case "formField": {
      if (mode === "full") {
        const cardBg = (block as { fieldCardColor?: string }).fieldCardColor ?? "#ffffff";
        const cardText = (block as { fieldCardTextColor?: string }).fieldCardTextColor ?? "#111827";
        return (
          <div className={block.width === "half" ? "md:max-w-[50%]" : "w-full"}>
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: cardBg, color: cardText }}>
              <label className="mb-1 block text-sm font-medium" style={{ color: cardText }}>
                {block.label}
                {block.required && <span className="ml-1 text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder={block.placeholder || "Guest response here"}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              />
              {block.hint && <p className="mt-1 text-xs text-gray-400">{block.hint}</p>}
            </div>
          </div>
        );
      }
      return (
        <div className={block.width === "half" ? "md:max-w-[50%]" : "w-full"}>
          <label className="mb-1 block text-xs font-semibold text-white">
            {block.label}
            {block.required && <span className="ml-1 text-rose-300">*</span>}
          </label>
          <div className="rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-xs text-white/80">
            {block.placeholder || "Guest response here"}
          </div>
          {block.hint && <p className="mt-1 text-[10px] text-white/60">{block.hint}</p>}
        </div>
      );
    }
    case "cta": {
      const btnStyle = { background: (block as { ctaColor?: string }).ctaColor ?? accentColor, color: (block as { ctaTextColor?: string }).ctaTextColor ?? "#0f172a" };
      const btnCls = `rounded-full font-semibold shadow ${mode === "full" ? "px-8 py-3 text-sm transition hover:opacity-90" : "px-5 py-2 text-xs"}`;
      return (
        <div
          className={`flex ${
            block.align === "center" ? "justify-center" : block.align === "right" ? "justify-end" : "justify-start"
          }`}
        >
          {mode === "full" && (block as { href?: string }).href && (block as { href?: string }).href !== "#" ? (
            <a
              href={(block as { href?: string }).href}
              target="_blank"
              rel="noreferrer"
              className={btnCls}
              style={btnStyle}
            >
              {block.label}
            </a>
          ) : (
            <button type="button" className={btnCls} style={btnStyle}>
              {block.label}
            </button>
          )}
        </div>
      );
    }
    case "image": {
      const active = block.images.find((img) => img.id === block.activeImageId) ?? block.images[0];
      if (mode === "full") {
        const h = block.height === "tall" ? "h-80" : block.height === "short" ? "h-48" : "h-64";
        return (
          <div className={`overflow-hidden rounded-2xl ${h}`}>
            {active ? (
              <img src={active.src} alt={active.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
            ) : null}
            {block.caption && <p className="bg-black/40 px-4 py-2 text-xs text-white/80">{block.caption}</p>}
          </div>
        );
      }
      const h = block.height === "tall" ? "h-56" : block.height === "short" ? "h-32" : "h-44";
      return (
        <div className={`overflow-hidden rounded-xl border border-white/15 bg-white/5 ${h}`}>
          {active ? (
            <img src={active.src} alt={active.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/50">Upload images to display</div>
          )}
          {block.caption && (
            <div className="bg-black/35 px-3 py-1.5 text-[10px] text-white/75">{block.caption}</div>
          )}
        </div>
      );
    }
    case "attendance":
      if (mode === "full") return null;
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-white">{block.title || "Will you be attending?"}</p>
          {block.subtitle && <p className="text-[10px] text-white/60">{block.subtitle}</p>}
          <div className="flex gap-1.5">
            {["Yes", "No", "Maybe"].map((v) => (
              <span key={v} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/80">{v}</span>
            ))}
          </div>
        </div>
      );
    case "guestDetails": {
      const fields = block.showFields ?? { name: true, phone: true, pax: true, remarks: true };
      if (mode === "full") {
        const cardBg = block.cardColor ?? "#ffffff";
        const cardText = block.cardTextColor ?? "#111827";
        const fieldDefs = [
          { key: "name" as const, label: "Your name", placeholder: "Full name" },
          { key: "phone" as const, label: "Phone number", placeholder: "+60 12-345 6789" },
          { key: "pax" as const, label: "Number of guests", placeholder: "1" },
          { key: "remarks" as const, label: "Remarks", placeholder: "Dietary requirements, allergies, etc." },
        ];
        const visibleFields = fieldDefs.filter(({ key }) => fields[key] !== false);
        return (
          <div className="w-full space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">{block.title || "Your details"}</p>
              {block.subtitle && <p className="mt-0.5 text-xs text-white/60">{block.subtitle}</p>}
            </div>
            <div className="rounded-xl p-4 shadow-sm space-y-4" style={{ backgroundColor: cardBg, color: cardText }}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visibleFields.map(({ key, label, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: cardText }}>
                      {label} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={key === "pax" ? "number" : "text"}
                      placeholder={placeholder}
                      disabled
                      className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      const visible = Object.entries(fields).filter(([, v]) => v !== false).map(([k]) => k);
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-white">{block.title || "Your details"}</p>
          {block.subtitle && <p className="text-[10px] text-white/60">{block.subtitle}</p>}
          <div className="flex flex-wrap gap-1">
            {visible.map((f) => (
              <span key={f} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/70 capitalize">{f}</span>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FullPagePreview — exported for RsvpSharePreviewPage
// ─────────────────────────────────────────────────────────────────────────────
export function FullPagePreview({
  blocks,
  backgroundColor,
  backgroundAsset,
  backgroundType,
  overlay,
  accentColor,
  flowPreset = "serene",
  contentWidth,
}: {
  blocks: RsvpBlock[];
  backgroundColor: string;
  backgroundAsset: string;
  backgroundType: "color" | "image" | "video";
  overlay: number;
  accentColor: string;
  flowPreset?: FlowPreset;
  /** Accepts the retired "full" from older saved designs; normalised on read. */
  contentWidth?: StoredContentWidth;
}) {
  // Same helper the public guest page uses, so the preview cannot drift from
  // what a guest actually sees. Undefined and "full" both fall back to the
  // default key rather than to an old edge-to-edge width.
  const maxWidthCls = contentWidthClass(contentWidth);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0" aria-hidden>
        {backgroundType === "color" && <div className="h-full w-full" style={{ background: backgroundColor }} />}
        {backgroundType === "image" && backgroundAsset && (
          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${backgroundAsset})` }} />
        )}
        {backgroundType === "video" && backgroundAsset && (
          <video className="h-full w-full object-cover" src={backgroundAsset} autoPlay loop muted playsInline />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(15,23,42,${overlay})` }} />
      </div>

      <div
        className={`relative mx-auto flex w-full ${maxWidthCls} flex-col gap-6 px-4 py-12 ${
          flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""
        }`}
      >
        {blocks.map((block) => {
          const bgImages = block.background?.images ?? [];
          const activeBg =
            bgImages.find((img) => img.id === block.background?.activeImageId) ??
            bgImages[0] ??
            block.sectionImage;
          const overlayStr = block.background?.overlay ?? 0.35;
          const content = renderBlockPreview(block, accentColor, "full");
          if (content === null) return null;

          return (
            <section
              key={block.id}
              className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition duration-500 hover:-translate-y-1 ${
                flowPreset === "stacked" ? "scroll-snap-start" : ""
              }`}
              style={{
                backgroundImage: activeBg
                  ? `linear-gradient(rgba(15,23,42,${overlayStr}),rgba(15,23,42,${overlayStr})),url(${activeBg.src})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: flowPreset === "parallax" ? "fixed" : "scroll",
              }}
            >
              <div className="space-y-4 text-white">{content}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
