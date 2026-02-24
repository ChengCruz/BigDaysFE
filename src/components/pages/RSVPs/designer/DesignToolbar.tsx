// designer/DesignToolbar.tsx
// Top toolbar: event info, save/preview controls, and shareable link section.
import { Link } from "react-router-dom";
import { Button } from "../../../atoms/Button";
import { Spinner } from "../../../atoms/Spinner";

interface Props {
  eventName?: string;
  isLoadingDesign: boolean;
  isSaving: boolean;
  isSaveSuccess: boolean;
  eventId: string | null;
  publicLink: string | null;
  linkCopied: boolean;
  onSave: () => void;
  onPreview: () => void;
  onGenerateLink: () => void;
  onCopyLink: () => void;
}

export function DesignToolbar({
  eventName,
  isLoadingDesign,
  isSaving,
  isSaveSuccess,
  eventId,
  publicLink,
  linkCopied,
  onSave,
  onPreview,
  onGenerateLink,
  onCopyLink,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Title + action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-400">RSVP experience designer</p>
          <h1 className="text-2xl font-bold text-primary">Design your wedding card</h1>
          {eventName && (
            <p className="text-sm text-gray-500">
              Event: <span className="font-semibold text-gray-700">{eventName}</span>
            </p>
          )}
          {isLoadingDesign && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Spinner />
              <span>Loading saved design…</span>
            </div>
          )}
          {isSaveSuccess && !isSaving && (
            <p className="text-sm font-medium text-emerald-600">✓ Design saved</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/app/rsvps">
            <Button variant="secondary">← Back</Button>
          </Link>
          <Button variant="secondary" onClick={onPreview}>
            Preview
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || isLoadingDesign || !eventId}
          >
            {isSaving ? "Saving…" : "Save Design"}
          </Button>
        </div>
      </div>

      {/* Shareable link section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Share with guests</p>
            <p className="text-xs text-gray-400">
              Generate a unique link so guests can view the invitation and submit their RSVP.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onGenerateLink}>
              Generate link
            </Button>
            {publicLink && (
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
              >
                Open as guest
              </a>
            )}
          </div>
        </div>

        {publicLink && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center">
            <input
              value={publicLink}
              readOnly
              className="flex-1 rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onCopyLink}>
                {linkCopied ? "Copied!" : "Copy link"}
              </Button>
              {linkCopied && (
                <span className="text-xs font-semibold text-emerald-600">Ready to share</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
