// src/components/pages/Backgrounds/generator/PresetPicker.tsx
import { useState } from "react";
import { useBackgroundPresets } from "../../../../api/hooks/useAiBackgroundApi";
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  type BackgroundCategory,
} from "../../../../types/aiBackground";

interface PresetPickerProps {
  selectedPresetId?: string;
  onSelect: (presetId: string, promptTemplate: string) => void;
}

const GROUP_NAMES = Object.keys(CATEGORY_GROUPS) as Array<
  keyof typeof CATEGORY_GROUPS
>;

export function PresetPicker({ selectedPresetId, onSelect }: PresetPickerProps) {
  const [activeGroup, setActiveGroup] = useState<string>(GROUP_NAMES[0]);
  const { data: presets = [], isLoading } = useBackgroundPresets();

  const activeCategories = CATEGORY_GROUPS[activeGroup] ?? [];
  const filtered = presets.filter((p) =>
    activeCategories.includes(p.category as BackgroundCategory)
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-white/70">
        Or pick a scenery preset
      </label>

      {/* Category group tabs */}
      <div className="flex gap-2">
        {GROUP_NAMES.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeGroup === group
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/15"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Presets grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-video rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onSelect(preset.id, preset.promptTemplate ?? preset.name)
              }
              className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition ${
                selectedPresetId === preset.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-primary/40"
              }`}
            >
              <img
                src={preset.thumbnailUrl ?? preset.imageUrl}
                alt={preset.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x225/e2e8f0/94a3b8?text=" +
                    encodeURIComponent(preset.name);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs font-medium text-white truncate">
                  {preset.name}
                </p>
                <p className="text-[10px] text-white/70">
                  {CATEGORY_LABELS[preset.category] ?? preset.category}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-gray-400 dark:text-white/40 text-center py-8">
              No presets in this category
            </p>
          )}
        </div>
      )}
    </div>
  );
}
