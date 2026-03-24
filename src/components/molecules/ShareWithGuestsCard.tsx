// src/components/molecules/ShareWithGuestsCard.tsx
// Reusable "Share with guests" card — generates & copies the public RSVP link.
import { useEffect, useState } from "react";
import { Button } from "../atoms/Button";
import { useRsvpDesign } from "../../api/hooks/useRsvpDesignApi";

const uid = () => Math.random().toString(36).slice(2, 9);

interface Props {
  eventId: string;
}

export function ShareWithGuestsCard({ eventId }: Props) {
  const { data: savedDesign } = useRsvpDesign(eventId);

  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Restore link from saved design once loaded
  useEffect(() => {
    if (savedDesign?.shareToken) {
      setPublicLink(
        `${window.location.origin}/rsvp/submit/${savedDesign.shareToken}?event=${eventId}`
      );
    }
  }, [savedDesign, eventId]);

  const generatePublicLink = () => {
    const token = uid();
    setPublicLink(`${window.location.origin}/rsvp/submit/${token}?event=${eventId}`);
    setLinkCopied(false);
  };

  const copyLink = async () => {
    if (!publicLink || !navigator.clipboard) return;
    await navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">Share with guests</p>
          <p className="text-xs text-gray-400">
            Generate a unique link so guests can view the invitation and RSVP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="secondary" onClick={generatePublicLink}>
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

      {publicLink ? (
        <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
          <input
            value={publicLink}
            readOnly
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" onClick={copyLink}>
              {linkCopied ? "Copied!" : "Copy link"}
            </Button>
            {linkCopied && (
              <span className="text-xs font-semibold text-emerald-600">
                ✓ Ready to share
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 text-xs text-gray-400">
          No link generated yet — click{" "}
          <span className="font-semibold text-gray-500">Generate link</span> above.
        </div>
      )}
    </div>
  );
}
