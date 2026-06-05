// designer/GlobalSettingsPanel.tsx
// Global design settings: background, accent color, overlay, music, submit button.
import React, { useEffect } from "react";

export const BACKDROP_OPTIONS: { label: string; value: string }[] = [
  { label: "None",              value: "" },
  { label: "Misty Mountains",   value: "/backgrounds/bg-01-misty-mountains.png" },
  { label: "Sumi Mountains",    value: "/backgrounds/bg-01b-sumi-mountains.png" },
  { label: "Sunset Mountains",  value: "/backgrounds/bg-01c-sunset-mountains.png" },
  { label: "Silk Ribbons",      value: "/backgrounds/bg-02-silk-ribbons.png" },
  { label: "Blush Ribbons",     value: "/backgrounds/bg-02b-blush-ribbons.png" },
  { label: "Dusty Blue Ribbons",value: "/backgrounds/bg-02c-dustyblue-ribbons.png" },
  { label: "Garden",            value: "/backgrounds/bg-03-garden-bottom.png" },
  { label: "Lavender Field",    value: "/backgrounds/bg-03b-lavender-field.png" },
  { label: "Wildflower Peach",  value: "/backgrounds/bg-03c-wildflower-peach.png" },
  { label: "Ocean Horizon",     value: "/backgrounds/bg-04-ocean-horizon.png" },
  { label: "Tropical Water",    value: "/backgrounds/bg-04b-tropical-water.png" },
  { label: "Golden Hour Coast", value: "/backgrounds/bg-04c-goldenhour-coast.png" },
  { label: "Herbarium",         value: "/backgrounds/bg-05-herbarium.png" },
  { label: "Pressed Flowers",   value: "/backgrounds/bg-05b-pressed-flowers.png" },
  { label: "Eucalyptus",        value: "/backgrounds/bg-05c-eucalyptus.png" },
  { label: "Celestial Midnight",value: "/backgrounds/bg-06-celestial-midnight.png" },
  { label: "Celestial Plum",    value: "/backgrounds/bg-06b-celestial-plum.png" },
  { label: "Celestial Emerald", value: "/backgrounds/bg-06c-celestial-emerald.png" },
  { label: "Minimal Gold",      value: "/backgrounds/bg-06-minimal-gold.png" },
  { label: "Rose Gold Arch",    value: "/backgrounds/bg-06c-rosegold-arch.png" },
];

type ContentWidth = "compact" | "standard" | "wide" | "full";

interface GlobalSettings {
  globalBackgroundType: "color" | "image" | "video";
  globalBackgroundColor: string;
  globalOverlay: number;
  accentColor: string;
  globalMusicUrl: string;
  submitButtonColor: string;
  submitButtonTextColor: string;
  submitButtonLabel: string;
  globalFontFamily?: string;
  contentWidth?: ContentWidth;
  blockMarginX?: number;
  blockMarginY?: number;
  previewBackdropColor?: string;
  previewBackdropImage?: string;
}

interface Props extends GlobalSettings {
  onChange: (patch: Partial<GlobalSettings>) => void;
  onUploadBackground: (file: File) => void;
  hasBackgroundAsset: boolean;
}

const FONT_OPTIONS: { value: string; label: string; googleFont?: string }[] = [
  { value: "",                                  label: "Georgia (default)" },
  { value: "'Playfair Display', serif",         label: "Playfair Display",    googleFont: "Playfair+Display:ital,wght@0,400;0,600;1,400" },
  { value: "'Cormorant Garamond', serif",       label: "Cormorant Garamond",  googleFont: "Cormorant+Garamond:ital,wght@0,400;0,600;1,400" },
  { value: "'Lato', sans-serif",                label: "Lato",                googleFont: "Lato:wght@400;700" },
  { value: "'Raleway', sans-serif",             label: "Raleway",             googleFont: "Raleway:wght@400;600;700" },
  { value: "'Dancing Script', cursive",         label: "Dancing Script",      googleFont: "Dancing+Script:wght@400;700" },
];

const WIDTH_PRESETS: { value: ContentWidth; label: string; desc: string; icon: string }[] = [
  { value: "compact",  icon: "📱", label: "Compact",  desc: "Phone-like narrow layout" },
  { value: "standard", icon: "📋", label: "Standard", desc: "Default balanced width" },
  { value: "wide",     icon: "🖥",  label: "Wide",     desc: "Wider content area" },
  { value: "full",     icon: "↔",  label: "Full",     desc: "Edge-to-edge, no side margins" },
];


const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{children}</p>
);

const ColorRow = ({
  value,
  defaultValue,
  onChange,
}: {
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={value || defaultValue}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-14 cursor-pointer rounded-lg border border-gray-200 p-0.5"
    />
    <span className="font-mono text-xs text-gray-500">{value || defaultValue}</span>
    {value && value !== defaultValue && (
      <button
        type="button"
        onClick={() => onChange(defaultValue)}
        className="text-[10px] text-gray-400 underline hover:text-gray-600"
      >
        reset
      </button>
    )}
  </div>
);

export function GlobalSettingsPanel({
  globalBackgroundType,
  globalBackgroundColor,
  globalOverlay,
  accentColor,
  globalMusicUrl,
  submitButtonColor,
  submitButtonTextColor,
  submitButtonLabel,
  globalFontFamily = "",
  contentWidth = "full",
  blockMarginX = 0,
  blockMarginY = 0,
  previewBackdropColor = "#f3f4f6",
  previewBackdropImage = "",
  onChange,
  onUploadBackground,
  hasBackgroundAsset,
}: Props) {
  // Dynamically load Google Font when selection changes
  useEffect(() => {
    const option = FONT_OPTIONS.find((f) => f.value === globalFontFamily);
    if (!option?.googleFont) return;
    const id = `gfont-${option.googleFont}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${option.googleFont}&display=swap`;
    document.head.appendChild(link);
  }, [globalFontFamily]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5">
        <h3 className="text-sm font-bold text-gray-800">Global settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">Background, colors, and buttons</p>
      </div>

      <div className="space-y-5 p-5">

        {/* ── Background type ── */}
        <div className="space-y-3">
          <SectionTitle>Background</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {(["color", "image", "video"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ globalBackgroundType: opt })}
                className={`rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
                  globalBackgroundType === opt
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {globalBackgroundType === "color" && (
            <ColorRow
              value={globalBackgroundColor}
              defaultValue="#f6f1e4"
              onChange={(v) => onChange({ globalBackgroundColor: v })}
            />
          )}

          {(globalBackgroundType === "image" || globalBackgroundType === "video") && (
            <div className="space-y-1.5">
              <input
                type="file"
                accept={globalBackgroundType === "video" ? "video/*" : "image/*"}
                onChange={(e) => e.target.files?.[0] && onUploadBackground(e.target.files[0])}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs"
              />
              {hasBackgroundAsset && (
                <p className="text-xs font-medium text-emerald-600">
                  ✓ {globalBackgroundType === "video" ? "Video" : "Image"} attached
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Dark overlay ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Dark overlay</SectionTitle>
            <span className="text-xs tabular-nums text-gray-400">{Math.round(globalOverlay * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.05}
            value={globalOverlay}
            onChange={(e) => onChange({ globalOverlay: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
          <p className="text-xs text-gray-400">Keeps text readable over photos and videos.</p>
        </div>

        {/* ── Accent color ── */}
        <div className="space-y-2">
          <SectionTitle>Accent color</SectionTitle>
          <div className="flex items-center gap-3">
            <ColorRow
              value={accentColor}
              defaultValue="#f97316"
              onChange={(v) => onChange({ accentColor: v })}
            />
          </div>
          <p className="text-xs text-gray-400">Used for highlights and any button without a custom color.</p>
        </div>

        {/* ── Font family ── */}
        <div className="space-y-2">
          <SectionTitle>Font family</SectionTitle>
          <div className="space-y-1.5">
            {FONT_OPTIONS.map(({ value, label }) => (
              <button
                key={value || "__default__"}
                type="button"
                onClick={() => onChange({ globalFontFamily: value })}
                className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${
                  globalFontFamily === value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-sm font-semibold" style={{ fontFamily: value || "Georgia, 'Times New Roman', serif" }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">Applies to all text in the design canvas.</p>
        </div>

        {/* ── Submit button ── */}
        <div className="space-y-3">
          <SectionTitle>Submit button</SectionTitle>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Button label</label>
              <input
                type="text"
                value={submitButtonLabel}
                onChange={(e) => onChange({ submitButtonLabel: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
                placeholder="Submit RSVP"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Button color</label>
                <ColorRow
                  value={submitButtonColor}
                  defaultValue={accentColor}
                  onChange={(v) => onChange({ submitButtonColor: v })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Text color</label>
                <ColorRow
                  value={submitButtonTextColor}
                  defaultValue="#0f172a"
                  onChange={(v) => onChange({ submitButtonTextColor: v })}
                />
              </div>
            </div>
            {/* Live preview */}
            <div className="flex justify-center">
              <div
                className="inline-flex min-w-[160px] items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold shadow"
                style={{
                  background: submitButtonColor || accentColor,
                  color: submitButtonTextColor || "#0f172a",
                }}
              >
                {submitButtonLabel || "Submit RSVP"}
              </div>
            </div>
          </div>
        </div>


        {/* ── Content width — hidden (mobile-only; always "full") ── */}

        {/* ── Block spacing ── */}
        <div className="space-y-3">
          <SectionTitle>Block spacing</SectionTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">Horizontal margin</label>
              <span className="text-xs tabular-nums text-gray-400">{blockMarginX}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              step={2}
              value={blockMarginX}
              onChange={(e) => onChange({ blockMarginX: parseInt(e.target.value, 10) })}
              className="w-full accent-primary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">Vertical margin</label>
              <span className="text-xs tabular-nums text-gray-400">{blockMarginY}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              step={2}
              value={blockMarginY}
              onChange={(e) => onChange({ blockMarginY: parseInt(e.target.value, 10) })}
              className="w-full accent-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ blockMarginX: 0, blockMarginY: 0 })}
              className="text-[10px] text-gray-400 underline hover:text-gray-600"
            >
              reset to flush (0 / 0)
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Adds optional horizontal inset and vertical gap between blocks. 0 = edge-to-edge (default). Applied identically in the canvas, preview, and public guest page.
          </p>
        </div>

        {/* ── Preview backdrop ── */}
        <div className="space-y-3">
          <SectionTitle>Preview backdrop</SectionTitle>
          <p className="text-xs text-gray-400">Shown outside the mobile frame in preview only — not visible to guests.</p>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKDROP_OPTIONS.map((opt) => {
              const selected = previewBackdropImage === opt.value;
              return (
                <button
                  key={opt.value || "__none__"}
                  type="button"
                  title={opt.label}
                  onClick={() => onChange({
                    previewBackdropImage: opt.value,
                    previewBackdropColor: opt.value === "" ? "#ffffff" : "#f3f4f6",
                  })}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    selected
                      ? "border-primary shadow-md scale-[1.04]"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ height: 48 }}
                >
                  {opt.value === "" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white gap-0.5">
                      <span className="text-[16px] leading-none">○</span>
                      <span className="text-[9px] text-gray-400 font-medium">None</span>
                    </div>
                  ) : (
                    <img src={opt.value} alt={opt.label} className="w-full h-full object-cover" />
                  )}
                  {selected && opt.value !== "" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-white text-xs font-bold drop-shadow">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {previewBackdropImage && (
            <p className="text-xs text-gray-500 truncate">
              {BACKDROP_OPTIONS.find((o) => o.value === previewBackdropImage)?.label ?? "Custom"}
            </p>
          )}
        </div>

        {/* ── Ambient music — hidden for now, to be implemented later ──
        <div className="space-y-2">
          <SectionTitle>Ambient music</SectionTitle>
          <input
            type="url"
            value={globalMusicUrl}
            onChange={(e) => onChange({ globalMusicUrl: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
            placeholder="https://example.com/music.mp3"
          />
          <p className="text-xs text-gray-400">Direct link to .mp3/.ogg — guests see a floating play button.</p>
        </div>
        ── */}

      </div>
    </div>
  );
}
