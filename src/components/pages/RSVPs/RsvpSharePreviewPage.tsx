import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { FullPagePreview, type FlowPreset, type RsvpBlock } from "./RsvpDesignPage";
import { Button } from "../../atoms/Button";

type Snapshot = {
  eventTitle?: string;
  blocks?: RsvpBlock[];
  flowPreset?: FlowPreset;
  global?: {
    backgroundColor?: string;
    backgroundAsset?: string;
    backgroundType?: "color" | "image" | "video";
    overlay?: number;
    accentColor?: string;
  };
};

export default function RsvpSharePreviewPage() {
  const { token } = useParams<{ token: string }>();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(`rsvp-share-${token}`);
    if (!stored) return;
    try {
      setSnapshot(JSON.parse(stored));
    } catch {
      setSnapshot(null);
    }
  }, [token]);

  const background = snapshot?.global ?? {};
  const flowPreset = snapshot?.flowPreset ?? "serene";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black px-4 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Guest preview</p>
            <h1 className="text-3xl font-bold">{snapshot?.eventTitle ?? "Shared RSVP preview"}</h1>
            <p className="text-sm text-white/70">This view mirrors the public invite experience generated from the designer.</p>
          </div>
          <Link to="/login">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>

        {!snapshot?.blocks?.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <p className="text-lg font-semibold text-white">This preview link is empty.</p>
            <p className="text-sm">Ask the host to regenerate a link from the designer so you can view the invite card.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            <FullPagePreview
              blocks={snapshot.blocks}
              backgroundAsset={background.backgroundAsset ?? ""}
              backgroundColor={background.backgroundColor ?? "#0f172a"}
              backgroundType={background.backgroundType ?? "color"}
              overlay={background.overlay ?? 0.3}
              accentColor={background.accentColor ?? "#f97316"}
              flowPreset={flowPreset}
            />
          </div>
        )}
      </div>
    </div>
  );
}

