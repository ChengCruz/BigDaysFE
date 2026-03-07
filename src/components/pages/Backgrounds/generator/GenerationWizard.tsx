// src/components/pages/Backgrounds/generator/GenerationWizard.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "../../../molecules/Modal";
import { Button } from "../../../atoms/Button";
import { PhotoUploader } from "./PhotoUploader";
import { PromptInput } from "./PromptInput";
import { PresetPicker } from "./PresetPicker";
import { GenerationProgress } from "./GenerationProgress";
import { useGenerateBackground } from "../../../../api/hooks/useAiBackgroundApi";
import type { GenerationFormState } from "../../../../types/aiBackground";
import toast from "react-hot-toast";

interface GenerationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  eventGuid: string;
}

type Step = 0 | 1 | 2;
const STEP_TITLES = ["Upload Photos", "Prompt & Style", "Generating"];

export function GenerationWizard({
  isOpen,
  onClose,
  eventGuid,
}: GenerationWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<GenerationFormState>({
    prompt: "",
    photos: [],
  });
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const objectUrlsRef = useRef<string[]>([]);
  const generateMutation = useGenerateBackground();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setForm({ prompt: "", photos: [] });
    setGeneratingId(null);
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePhotosChange = (photos: File[]) => {
    setForm((f) => ({ ...f, photos }));
  };

  const handlePresetSelect = (presetId: string, promptTemplate: string) => {
    setForm((f) => ({
      ...f,
      selectedPresetId: presetId,
      prompt: promptTemplate,
    }));
  };

  const handleGenerate = async () => {
    if (!form.prompt.trim()) {
      toast.error("Please enter a prompt or select a preset.");
      return;
    }

    try {
      setStep(2);
      const result = await generateMutation.mutateAsync({
        photos: form.photos,
        prompt: form.prompt,
        eventGuid,
      });
      setGeneratingId(result.id);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to start generation.");
      setStep(1);
    }
  };

  const canProceedStep0 = form.photos.length > 0;
  const canProceedStep1 = form.prompt.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      title={`Generate Background - ${STEP_TITLES[step]}`}
      onClose={handleClose}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEP_TITLES.map((title, i) => (
            <div key={title} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full text-xs font-semibold grid place-items-center transition ${
                  i <= step
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/40"
                }`}
              >
                {i + 1}
              </div>
              {i < STEP_TITLES.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    i < step
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-white/60">
              Upload 1-5 couple photos. The AI will use these to create your personalized background.
            </p>
            <PhotoUploader photos={form.photos} onChange={handlePhotosChange} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <PromptInput
              value={form.prompt}
              onChange={(prompt) => setForm((f) => ({ ...f, prompt }))}
            />
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <PresetPicker
                selectedPresetId={form.selectedPresetId}
                onSelect={handlePresetSelect}
              />
            </div>
          </div>
        )}

        {step === 2 && generatingId && (
          <GenerationProgress
            backgroundId={generatingId}
            onComplete={handleClose}
            onFailed={(err) => {
              toast.error(err ?? "Generation failed. Please try again.");
              setStep(1);
              setGeneratingId(null);
            }}
          />
        )}

        {step === 2 && !generatingId && (
          <div className="flex justify-center py-12">
            <Button loading>Submitting...</Button>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 2 && (
          <div className="flex justify-between pt-2">
            <Button
              variant="secondary"
              onClick={step === 0 ? handleClose : () => setStep((s) => (s - 1) as Step)}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>

            {step === 0 && (
              <Button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
              >
                Next
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={handleGenerate}
                disabled={!canProceedStep1}
                loading={generateMutation.isPending}
              >
                Generate
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
