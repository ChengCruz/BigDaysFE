// src/components/pages/Backgrounds/generator/PromptInput.tsx

const SUGGESTIONS = [
  "Romantic sunset garden with fairy lights",
  "Elegant ballroom with crystal chandeliers",
  "Rustic barn wedding with wildflowers",
  "Tropical beach ceremony at golden hour",
  "Modern minimalist venue with geometric accents",
];

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PromptInput({ value, onChange }: PromptInputProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-white/70">
        Describe your dream background
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="E.g., A romantic garden at sunset with fairy lights and blooming roses..."
        rows={4}
        className="w-full rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition"
      />

      <div>
        <p className="text-xs text-gray-500 dark:text-white/40 mb-2">
          Try a suggestion:
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/15 text-gray-600 dark:text-white/60 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
