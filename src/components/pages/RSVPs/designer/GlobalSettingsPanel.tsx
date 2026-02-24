// designer/GlobalSettingsPanel.tsx
// Global design settings: background (color/image/video), music, overlay, accent color, flow preset.
import type { FlowPreset } from "../../../../types/rsvpDesign";

interface GlobalSettings {
  globalBackgroundType: "color" | "image" | "video";
  globalBackgroundColor: string;
  globalOverlay: number;
  accentColor: string;
  flowPreset: FlowPreset;
  globalMusicUrl: string;
}

interface Props extends GlobalSettings {
  onChange: (patch: Partial<GlobalSettings>) => void;
  onUploadBackground: (file: File) => void;
  hasBackgroundAsset: boolean;
}

const FLOW_PRESETS: { value: FlowPreset; label: string; desc: string }[] = [
  { value: "serene",   label: "Serene",   desc: "Gentle blur, subtle lift on hover" },
  { value: "parallax", label: "Parallax", desc: "Backgrounds scroll at fixed depth" },
  { value: "stacked",  label: "Stacked",  desc: "Snap-scroll between sections" },
];

export function GlobalSettingsPanel({
  globalBackgroundType,
  globalBackgroundColor,
  globalOverlay,
  accentColor,
  flowPreset,
  globalMusicUrl,
  onChange,
  onUploadBackground,
  hasBackgroundAsset,
}: Props) {
  return (
    <div className="space-y-5 rounded-xl border border-gray-200 p-4">
      {/* ── Background type ── */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Global background</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["color", "image", "video"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ globalBackgroundType: opt })}
              className={`rounded-lg border py-2 text-xs font-semibold uppercase tracking-wide transition ${
                globalBackgroundType === opt
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {globalBackgroundType === "color" && (
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Background color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={globalBackgroundColor}
                onChange={(e) => onChange({ globalBackgroundColor: e.target.value })}
                className="h-9 w-16 cursor-pointer rounded border p-0.5"
              />
              <span className="text-xs font-mono text-gray-500">{globalBackgroundColor}</span>
            </div>
          </div>
        )}

        {(globalBackgroundType === "image" || globalBackgroundType === "video") && (
          <div className="space-y-1">
            <label className="text-xs text-gray-500">
              {globalBackgroundType === "video" ? "Upload video" : "Upload image"}
            </label>
            <input
              type="file"
              accept={globalBackgroundType === "video" ? "video/*" : "image/*"}
              onChange={(e) => e.target.files?.[0] && onUploadBackground(e.target.files[0])}
              className="w-full text-xs text-gray-600"
            />
            {hasBackgroundAsset && (
              <p className="text-xs font-medium text-emerald-600">
                ✓ {globalBackgroundType === "video" ? "Video" : "Image"} attached
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Overlay ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600">Dark overlay</label>
          <span className="text-xs text-gray-400">{Math.round(globalOverlay * 100)}%</span>
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
        <p className="text-xs text-gray-400">Keeps text readable over photos/videos.</p>
      </div>

      {/* ── Accent color ── */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-600">Accent color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            className="h-9 w-16 cursor-pointer rounded border p-0.5"
          />
          <span className="text-xs font-mono text-gray-500">{accentColor}</span>
        </div>
        <p className="text-xs text-gray-400">Used for buttons, badges, and highlights.</p>
      </div>

      {/* ── Ambient music ── */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-600">Ambient music URL</label>
        <input
          type="url"
          value={globalMusicUrl}
          onChange={(e) => onChange({ globalMusicUrl: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="https://example.com/music.mp3"
        />
        <p className="text-xs text-gray-400">
          Paste a direct link to an .mp3 or .ogg file. Guests see a floating play button.
        </p>
      </div>

      {/* ── Flow preset ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600">Scroll style</label>
        <div className="space-y-1.5">
          {FLOW_PRESETS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ flowPreset: value })}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                flowPreset === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs opacity-70">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
