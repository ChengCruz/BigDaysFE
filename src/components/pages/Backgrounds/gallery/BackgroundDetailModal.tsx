// src/components/pages/Backgrounds/gallery/BackgroundDetailModal.tsx
import { useState } from "react";
import { Modal } from "../../../molecules/Modal";
import { Button } from "../../../atoms/Button";
import { useDeleteBackground } from "../../../../api/hooks/useAiBackgroundApi";
import type { AiBackground } from "../../../../types/aiBackground";
import toast from "react-hot-toast";

interface BackgroundDetailModalProps {
  background: AiBackground | null;
  onClose: () => void;
}

export function BackgroundDetailModal({
  background,
  onClose,
}: BackgroundDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteBackground();

  if (!background) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(background.imageUrl);
      toast.success("Image URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: background.id,
        eventId: background.eventId,
      });
      toast.success("Background deleted.");
      onClose();
    } catch {
      toast.error("Failed to delete background.");
    }
  };

  return (
    <Modal
      isOpen={!!background}
      title="Background Details"
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Full-size preview */}
        {background.status === "completed" && background.imageUrl ? (
          <img
            src={background.imageUrl}
            alt={background.prompt}
            className="w-full rounded-xl object-contain max-h-[60vh]"
          />
        ) : (
          <div className="aspect-video rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-white/40">
              {background.status === "failed"
                ? "Generation failed"
                : "Image still generating..."}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-white/50">
              Prompt
            </p>
            <p className="text-sm text-gray-800 dark:text-white/90">
              {background.prompt}
            </p>
          </div>
          <div className="flex gap-4 text-xs text-gray-500 dark:text-white/40">
            <span>
              Created:{" "}
              {new Date(background.createdDate).toLocaleString()}
            </span>
            <span>Status: {background.status}</span>
            {background.category && (
              <span>Category: {background.category}</span>
            )}
          </div>
        </div>

        {/* Error message */}
        {background.errorMessage && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              {background.errorMessage}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <div className="flex gap-2">
            {background.status === "completed" && (
              <Button variant="secondary" onClick={handleCopyUrl}>
                Copy URL
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!confirmDelete ? (
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Delete
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  loading={deleteMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Confirm Delete
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
