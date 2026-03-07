// src/components/pages/Backgrounds/gallery/BackgroundCard.tsx
import type { AiBackground } from "../../../../types/aiBackground";

interface BackgroundCardProps {
  background: AiBackground;
  onClick: () => void;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Queued",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  },
  generating: {
    label: "Generating",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  completed: {
    label: "Ready",
    className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  },
};

export function BackgroundCard({ background, onClick }: BackgroundCardProps) {
  const badge = STATUS_BADGE[background.status] ?? STATUS_BADGE.pending;
  const isReady = background.status === "completed";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all hover:shadow-lg text-left"
    >
      {/* Image */}
      <div className="aspect-video bg-gray-100 dark:bg-white/5">
        {isReady && background.imageUrl ? (
          <img
            src={background.thumbnailUrl ?? background.imageUrl}
            alt={background.prompt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {background.status === "failed" ? (
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs text-gray-400 dark:text-white/40">Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info overlay */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-700 dark:text-white/80 line-clamp-2 flex-1">
            {background.prompt}
          </p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1">
          {new Date(background.createdDate).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}
