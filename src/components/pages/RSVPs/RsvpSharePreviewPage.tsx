import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { FullPagePreview, type FlowPreset, type RsvpBlock } from "./RsvpDesignPage";
import { Button } from "../../atoms/Button";
import { Spinner } from "../../atoms/Spinner";
import client from "../../../api/client";
import {
  PublicEventEndpoints,
  PublicRsvpEndpoints,
  RsvpDesignEndpoints,
} from "../../../api/endpoints";
import type { ApiRsvpDesign } from "../../../types/rsvpDesign";
import { mapToFrontendDesign } from "../../../utils/rsvpDesignMapper";

type PreviewData = {
  eventTitle?: string;
  blocks: RsvpBlock[];
  flowPreset: FlowPreset;
  backgroundColor: string;
  backgroundAsset: string;
  backgroundType: "color" | "image" | "video";
  overlay: number;
  accentColor: string;
  contentWidth?: "compact" | "standard" | "wide" | "full";
};

function toPreview(apiDesign: ApiRsvpDesign): PreviewData | null {
  if (!apiDesign?.design) return null;
  const mapped = mapToFrontendDesign(apiDesign);
  return {
    blocks: (mapped.blocks ?? []) as RsvpBlock[],
    flowPreset: (mapped.flowPreset ?? "serene") as FlowPreset,
    backgroundColor: mapped.globalBackgroundColor ?? "#0f172a",
    backgroundAsset: mapped.globalBackgroundAsset ?? "",
    backgroundType: (mapped.globalBackgroundType ?? "color") as "color" | "image" | "video",
    overlay: mapped.globalOverlay ?? 0.3,
    accentColor: mapped.accentColor ?? "#f97316",
    contentWidth: mapped.contentWidth,
  };
}

export default function RsvpSharePreviewPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const slugParam = searchParams.get("slug") ?? undefined;
  const eventGuidParam = searchParams.get("event") ?? undefined;

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Fallback chain for the preview page:
    //   1. Token endpoint (intended public path — currently unreliable; see
    //      .claude/todo/rsvp-v3-preview-public-sync.md).
    //   2. ?slug=  → public slug endpoint (works for everyone).
    //   3. ?event= → admin design endpoint (only works for logged-in admins).
    async function load() {
      setLoading(true);
      setError(false);

      if (token) {
        try {
          const res = await client.get(PublicRsvpEndpoints.designByToken(token));
          const apiDesign = (res.data?.data ?? res.data) as ApiRsvpDesign;
          const p = toPreview(apiDesign);
          if (p && !cancelled) {
            setPreview(p);
            setLoading(false);
            return;
          }
        } catch {
          // fall through
        }
      }

      if (slugParam) {
        try {
          const res = await client.get(PublicEventEndpoints.bySlug(slugParam));
          const data = res.data?.data ?? res.data;
          const p = toPreview(data?.rsvpDesign as ApiRsvpDesign);
          if (p && !cancelled) {
            setPreview(p);
            setLoading(false);
            return;
          }
        } catch {
          // fall through
        }
      }

      if (eventGuidParam) {
        try {
          const res = await client.get(RsvpDesignEndpoints.get(eventGuidParam));
          const apiDesign = (res.data?.data ?? res.data) as ApiRsvpDesign;
          const p = toPreview(apiDesign);
          if (p && !cancelled) {
            setPreview(p);
            setLoading(false);
            return;
          }
        } catch {
          // fall through
        }
      }

      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, slugParam, eventGuidParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Spinner />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 max-w-md text-center">
          <p className="text-lg font-semibold text-white mb-2">Preview unavailable</p>
          <p className="text-sm text-white/60">
            This preview link is invalid or has expired. Ask the host to generate a new preview.
          </p>
          <div className="mt-6">
            <Link to="/app/rsvps">
              <Button variant="secondary">Back to RSVPs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FullPagePreview
      blocks={preview.blocks}
      backgroundColor={preview.backgroundColor}
      backgroundAsset={preview.backgroundAsset}
      backgroundType={preview.backgroundType}
      overlay={preview.overlay}
      accentColor={preview.accentColor}
      flowPreset={preview.flowPreset}
      contentWidth={preview.contentWidth}
    />
  );
}
