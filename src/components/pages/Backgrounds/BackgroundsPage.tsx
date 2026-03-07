// src/components/pages/Backgrounds/BackgroundsPage.tsx
import { useState } from "react";
import { useEventContext } from "../../../context/EventContext";
import { useBackgroundsApi } from "../../../api/hooks/useAiBackgroundApi";
import { NoEventsState } from "../../molecules/NoEventsState";
import { PageLoader } from "../../atoms/PageLoader";
import { Button } from "../../atoms/Button";
import { GenerationWizard } from "./generator/GenerationWizard";
import { BackgroundGallery } from "./gallery/BackgroundGallery";
import { BackgroundDetailModal } from "./gallery/BackgroundDetailModal";
import type { AiBackground } from "../../../types/aiBackground";
import { PhotographIcon } from "@heroicons/react/solid";

export default function BackgroundsPage() {
  const { eventId } = useEventContext()!;

  if (!eventId) {
    return (
      <NoEventsState
        title="No Events for AI Backgrounds"
        message="Create your first event to start generating custom AI backgrounds."
      />
    );
  }

  return <BackgroundsContent eventId={eventId} />;
}

function BackgroundsContent({ eventId }: { eventId: string }) {
  const { data: backgrounds = [], isLoading } = useBackgroundsApi(eventId);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<AiBackground | null>(null);

  if (isLoading) {
    return <PageLoader message="Loading backgrounds..." />;
  }

  // Empty state
  if (backgrounds.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary text-white grid place-items-center mx-auto mb-6 shadow-xl shadow-primary/25">
              <PhotographIcon className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              AI Background Generator
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload your couple photos and let AI create stunning, personalized
              wedding backgrounds for your event.
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <PhotographIcon className="h-5 w-5 mr-2" />
              Generate Your First Background
            </Button>
          </div>
        </div>

        <GenerationWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          eventGuid={eventId}
        />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
            <PhotographIcon className="h-7 w-7" />
            AI Backgrounds
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {backgrounds.length} background{backgrounds.length !== 1 ? "s" : ""} generated
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <PhotographIcon className="h-4 w-4 mr-2" />
          Generate New
        </Button>
      </div>

      {/* Gallery */}
      <BackgroundGallery
        backgrounds={backgrounds}
        onSelect={setSelectedBackground}
      />

      {/* Modals */}
      <GenerationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        eventGuid={eventId}
      />
      <BackgroundDetailModal
        background={selectedBackground}
        onClose={() => setSelectedBackground(null)}
      />
    </>
  );
}
