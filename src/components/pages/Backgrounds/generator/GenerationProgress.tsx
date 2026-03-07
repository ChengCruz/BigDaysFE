// src/components/pages/Backgrounds/generator/GenerationProgress.tsx
import { useBackgroundStatus } from "../../../../api/hooks/useAiBackgroundApi";
import { Spinner } from "../../../atoms/Spinner";
import type { GenerationStatus } from "../../../../types/aiBackground";

interface GenerationProgressProps {
  backgroundId: string;
  onComplete: () => void;
  onFailed: (error?: string) => void;
}

const STATUS_MESSAGES: Record<GenerationStatus, string> = {
  pending: "Queued - waiting to start...",
  generating: "Creating your custom background...",
  completed: "Done! Your background is ready.",
  failed: "Generation failed.",
};

export function GenerationProgress({
  backgroundId,
  onComplete,
  onFailed,
}: GenerationProgressProps) {
  const { data: bg } = useBackgroundStatus(
    backgroundId,
    true // always poll while this component is mounted
  );

  const status = bg?.status ?? "pending";

  // Trigger callbacks on terminal states
  if (status === "completed") {
    // Use setTimeout to avoid calling setState during render
    setTimeout(() => onComplete(), 0);
  } else if (status === "failed") {
    setTimeout(() => onFailed(bg?.errorMessage), 0);
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {status === "completed" ? (
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/20 grid place-items-center">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : status === "failed" ? (
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 grid place-items-center">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ) : (
        <Spinner />
      )}

      <p className="text-sm font-medium text-gray-700 dark:text-white/70">
        {STATUS_MESSAGES[status]}
      </p>

      {status === "failed" && bg?.errorMessage && (
        <p className="text-xs text-red-500 max-w-sm text-center">
          {bg.errorMessage}
        </p>
      )}

      {(status === "pending" || status === "generating") && (
        <p className="text-xs text-gray-400 dark:text-white/40">
          This may take a minute...
        </p>
      )}
    </div>
  );
}
