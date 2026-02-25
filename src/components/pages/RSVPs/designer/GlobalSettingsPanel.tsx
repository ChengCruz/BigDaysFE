// designer/GlobalSettingsPanel.tsx
// Global design settings: background, accent color, overlay, music, flow preset, submit button.
import React from "react";
import type { FlowPreset } from "../../../../types/rsvpDesign";

interface GlobalSettings {
  globalBackgroundType: "color" | "image" | "video";
  globalBackgroundColor: string;
  globalOverlay: number;
  accentColor: string;
  flowPreset: FlowPreset;
  globalMusicUrl: string;
  submitButtonColor: string;
  submitButtonTextColor: string;
  submitButtonLabel: string;
}

interface Props extends GlobalSettings {
  onChange: (patch: Partial<GlobalSettings>) => void;
  onUploadBackground: (file: File) => void;
  hasBackgroundAsset: boolean;
}

const FLOW_PRESETS: { value: FlowPreset; label: string; desc: string; icon: string }[] = [
  { value: "serene",   label: "Serene",   icon: "✦", desc: "Gentle blur + subtle hover lift" },
  { value: "parallax", label: "Parallax", icon: "⟳", desc: "Backgrounds scroll at fixed depth" },
  { value: "stacked",  label: "Stacked",  icon: "⬛", desc: "Snap-scroll between sections" },
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
  flowPreset,
  globalMusicUrl,
  submitButtonColor,
  submitButtonTextColor,
  submitButtonLabel,
  onChange,
  onUploadBackground,
  hasBackgroundAsset,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5">
        <h3 className="text-sm font-bold text-gray-800">Global settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">Background, colors, buttons, and music</p>
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

        {/* ── Scroll style ── */}
        <div className="space-y-2">
          <SectionTitle>Scroll style</SectionTitle>
          <div className="space-y-1.5">
            {FLOW_PRESETS.map(({ value, label, desc, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ flowPreset: value })}
                className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${
                  flowPreset === value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <p className="mt-0.5 text-xs opacity-60">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Ambient music ── */}
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

      </div>
    </div>
  );
}
