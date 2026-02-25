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
    <div className="space-y-3">
      {/* ── Header card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: breadcrumb + title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/app/rsvps"
              className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              ← Back
            </Link>
            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">RSVP designer</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                {eventName ?? "Design your RSVP invite"}
              </h1>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex shrink-0 items-center gap-2.5">
            {isLoadingDesign && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <Spinner />
                <span className="hidden sm:inline">Loading…</span>
              </span>
            )}
            {isSaveSuccess && !isSaving && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-100">
                ✓ Saved
              </span>
            )}
            <Button variant="secondary" onClick={onPreview}>
              Preview
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving || isLoadingDesign || !eventId}
            >
              {isSaving ? "Saving…" : "Save design"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Share link card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Share with guests</p>
            <p className="text-xs text-gray-400">
              Generate a unique link so guests can view the invitation and RSVP.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" onClick={onGenerateLink}>
              {publicLink ? "Regenerate link" : "Generate link"}
            </Button>
            {publicLink && (
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition"
              >
                Open as guest ↗
              </a>
            )}
          </div>
        </div>

        {publicLink && (
          <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
            <input
              value={publicLink}
              readOnly
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono focus:outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" onClick={onCopyLink}>
                {linkCopied ? "Copied!" : "Copy link"}
              </Button>
              {linkCopied && (
                <span className="text-xs font-semibold text-emerald-600">
                  ✓ Ready to share
                </span>
              )}
            </div>
          </div>
        )}

        {!publicLink && (
          <div className="px-5 py-3 text-xs text-gray-400">
            No link generated yet — click <span className="font-semibold text-gray-500">Generate link</span> above.
          </div>
        )}
      </div>
    </div>
  );
}
