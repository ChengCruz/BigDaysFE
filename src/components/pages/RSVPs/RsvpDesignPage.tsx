// src/components/pages/RSVPs/RsvpDesignPage.tsx
// Admin RSVP designer — orchestrates all designer sub-components.
// Exports PhonePreview + FullPagePreview (used by RsvpSharePreviewPage).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEventContext } from "../../../context/EventContext";
import { useFormFields, type FormFieldConfig } from "../../../api/hooks/useFormFieldsApi";
import { useRsvpDesign, useSaveRsvpDesign } from "../../../api/hooks/useRsvpDesignApi";
import type { RsvpBlock, RsvpDesign, FlowPreset } from "../../../types/rsvpDesign";
import { NoEventsState } from "../../molecules/NoEventsState";
import { DesignToolbar } from "./designer/DesignToolbar";
import { BlockList } from "./designer/BlockList";
import { BlockEditor } from "./designer/BlockEditor";
import { GlobalSettingsPanel } from "./designer/GlobalSettingsPanel";

// Re-export types that RsvpSharePreviewPage imports from this module
export type { FlowPreset, RsvpBlock } from "../../../types/rsvpDesign";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

function renderBlockPreview(block: RsvpBlock, accentColor: string): React.ReactNode {
  switch (block.type) {
    case "headline":
      return (
        <div className={`text-${block.align}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Welcome</p>
          <h2 className={`mt-0.5 text-2xl font-extrabold text-white drop-shadow ${block.accent}`}>{block.title}</h2>
          {block.subtitle && <p className="mt-1 text-xs text-white/75">{block.subtitle}</p>}
        </div>
      );
    case "text":
      return <p className={`text-sm leading-relaxed ${block.muted ? "text-white/75" : "text-white"}`}>{block.body}</p>;
    case "info":
      return (
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs ${block.accent}`}>
          <span className="font-semibold uppercase tracking-wide">{block.label}</span>
          <span className="text-white/80">{block.content}</span>
        </div>
      );
    case "formField":
      return (
        <div className={block.width === "half" ? "md:max-w-[50%]" : "w-full"}>
          <label className="mb-1 block text-xs font-semibold text-white">
            {block.label}
            {block.required && <span className="ml-1 text-rose-300">*</span>}
          </label>
          <div className="rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-xs text-white/80">
            {block.placeholder || "Guest response here"}
          </div>
          {block.hint && <p className="mt-1 text-[10px] text-white/60">{block.hint}</p>}
        </div>
      );
    case "cta":
      return (
        <div
          className={`flex ${
            block.align === "center" ? "justify-center" : block.align === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <button
            className="rounded-full px-5 py-2 text-xs font-semibold shadow"
            style={{ background: accentColor, color: "#0f172a" }}
          >
            {block.label}
          </button>
        </div>
      );
    case "image": {
      const active = block.images.find((img) => img.id === block.activeImageId) ?? block.images[0];
      const h = block.height === "tall" ? "h-56" : block.height === "short" ? "h-32" : "h-44";
      return (
        <div className={`overflow-hidden rounded-xl border border-white/15 bg-white/5 ${h}`}>
          {active ? (
            <img src={active.src} alt={active.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/50">Upload images to display</div>
          )}
          {block.caption && (
            <div className="bg-black/35 px-3 py-1.5 text-[10px] text-white/75">{block.caption}</div>
          )}
        </div>
      );
    }
    case "attendance":
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-white">{block.title || "Will you be attending?"}</p>
          {block.subtitle && <p className="text-[10px] text-white/60">{block.subtitle}</p>}
          <div className="flex gap-1.5">
            {["Yes", "No", "Maybe"].map((v) => (
              <span key={v} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/80">{v}</span>
            ))}
          </div>
        </div>
      );
    case "guestDetails": {
      const fields = block.showFields ?? { name: true, email: true, phone: true, pax: true, guestType: true };
      const visible = Object.entries(fields).filter(([, v]) => v !== false).map(([k]) => k);
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-white">{block.title || "Your details"}</p>
          {block.subtitle && <p className="text-[10px] text-white/60">{block.subtitle}</p>}
          <div className="flex flex-wrap gap-1">
            {visible.map((f) => (
              <span key={f} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/70 capitalize">{f}</span>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PhonePreview — used in the admin preview modal + exported for SharePreviewPage
// ─────────────────────────────────────────────────────────────────────────────
export function PhonePreview({
  blocks,
  backgroundColor,
  backgroundAsset,
  backgroundType,
  overlay,
  accentColor,
  mode,
  flowPreset = "serene",
}: {
  blocks: RsvpBlock[];
  backgroundColor: string;
  backgroundAsset: string;
  backgroundType: "color" | "image" | "video";
  overlay: number;
  accentColor: string;
  mode: "mobile" | "desktop";
  flowPreset?: FlowPreset;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/25 shadow-2xl bg-gradient-to-b from-slate-900 to-black ${
        mode === "mobile" ? "w-[360px] max-w-full" : "w-full"
      }`}
    >
      <div className="absolute inset-0" aria-hidden>
        {backgroundType === "color" && <div className="h-full w-full" style={{ background: backgroundColor }} />}
        {backgroundType === "image" && backgroundAsset && (
          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${backgroundAsset})` }} />
        )}
        {backgroundType === "video" && backgroundAsset && (
          <video className="h-full w-full object-cover" src={backgroundAsset} autoPlay loop muted playsInline />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(15,23,42,${overlay})` }} />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white/70 bg-black/20 backdrop-blur-sm">
        <span>{mode === "mobile" ? "Mobile" : "Desktop"}</span>
        <span>RSVP preview</span>
      </div>

      <div
        className="relative z-10 overflow-auto px-3 pb-5 pt-3"
        style={{ maxHeight: mode === "mobile" ? 600 : 700 }}
      >
        <div className={`space-y-3 ${flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""}`}>
          {blocks.map((block, i) => {
            const bgImages = block.background?.images ?? [];
            const overlayStr = block.background?.overlay ?? 0.35;
            const activeBg =
              bgImages.find((img) => img.id === block.background?.activeImageId) ??
              bgImages[0] ??
              block.sectionImage;

            return (
              <div
                key={block.id}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3.5 transition duration-300 ${
                  flowPreset === "stacked" ? "scroll-snap-start" : ""
                } ${flowPreset === "serene" ? "backdrop-blur" : ""}`}
                style={{
                  backgroundImage: activeBg
                    ? `linear-gradient(rgba(15,23,42,${overlayStr}),rgba(15,23,42,${overlayStr})),url(${activeBg.src})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundAttachment: flowPreset === "parallax" ? "fixed" : "scroll",
                  transitionDelay: `${i * 25}ms`,
                }}
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentColor }} />
                  {block.type}
                </div>
                <div className="text-white">{renderBlockPreview(block, accentColor)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FullPagePreview — exported for RsvpSharePreviewPage
// ─────────────────────────────────────────────────────────────────────────────
export function FullPagePreview({
  blocks,
  backgroundColor,
  backgroundAsset,
  backgroundType,
  overlay,
  accentColor,
  flowPreset = "serene",
}: {
  blocks: RsvpBlock[];
  backgroundColor: string;
  backgroundAsset: string;
  backgroundType: "color" | "image" | "video";
  overlay: number;
  accentColor: string;
  flowPreset?: FlowPreset;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0" aria-hidden>
        {backgroundType === "color" && <div className="h-full w-full" style={{ background: backgroundColor }} />}
        {backgroundType === "image" && backgroundAsset && (
          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${backgroundAsset})` }} />
        )}
        {backgroundType === "video" && backgroundAsset && (
          <video className="h-full w-full object-cover" src={backgroundAsset} autoPlay loop muted playsInline />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(15,23,42,${overlay})` }} />
      </div>

      <div
        className={`relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12 ${
          flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""
        }`}
      >
        {blocks.map((block, i) => {
          const bgImages = block.background?.images ?? [];
          const activeBg =
            bgImages.find((img) => img.id === block.background?.activeImageId) ??
            bgImages[0] ??
            block.sectionImage;
          const overlayStr = block.background?.overlay ?? 0.35;
          const lift = flowPreset === "serene" ? "hover:-translate-y-1" : "hover:-translate-y-2";

          return (
            <section
              key={block.id}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/5 transition duration-500 ${
                flowPreset === "stacked" ? "scroll-snap-start" : ""
              } ${lift}`}
              style={{
                backgroundImage: activeBg
                  ? `linear-gradient(rgba(15,23,42,${overlayStr}),rgba(15,23,42,${overlayStr})),url(${activeBg.src})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: flowPreset === "parallax" ? "fixed" : "scroll",
              }}
            >
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-white/60">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: accentColor }} />
                  {block.type}
                </span>
                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px]">Scene {i + 1}</span>
              </div>
              <div className="space-y-3 text-white">{renderBlockPreview(block, accentColor)}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RsvpDesignPage — main orchestrator
// ─────────────────────────────────────────────────────────────────────────────
export default function RsvpDesignPage() {
  const { event, eventId } = useEventContext() ?? {};
  const { data: serverFormFields = [], isFetching: isFetchingQuestions } = useFormFields(eventId, {
    enabled: !!eventId,
  });
  const { data: savedDesign, isLoading: isLoadingDesign } = useRsvpDesign(eventId ?? "");
  const {
    mutate: saveDesign,
    isPending: isSaving,
    isSuccess: isSaveSuccess,
    data: saveResponse,
  } = useSaveRsvpDesign(eventId ?? "");

  // ── Design state ───────────────────────────────────────────────────────
  const [isDesignLoaded, setIsDesignLoaded] = useState(false);
  const [blocks, setBlocks] = useState<RsvpBlock[]>([
    {
      id: uid(),
      type: "headline",
      title: "Welcome to our wedding",
      subtitle: "Save the date and RSVP below",
      align: "center",
      accent: "text-white",
      background: { images: [], overlay: 0.4 },
    },
    {
      id: uid(),
      type: "text",
      body: "Share your love story, travel tips, or invite message. Guests will scroll through each image-backed section just like an interactive invitation card.",
      width: "full",
      align: "left",
      muted: true,
      background: { images: [], overlay: 0.4 },
    },
    {
      id: uid(),
      type: "attendance",
      title: "Will you be attending?",
      subtitle: "Please let us know",
      background: { images: [], overlay: 0.4 },
    },
    {
      id: uid(),
      type: "guestDetails",
      title: "Your details",
      subtitle: "Tell us about yourself",
      showFields: { name: true, email: true, phone: true, pax: true, guestType: true },
      background: { images: [], overlay: 0.4 },
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalBackgroundType, setGlobalBackgroundType] = useState<"color" | "image" | "video">("color");
  const [globalBackgroundAsset, setGlobalBackgroundAsset] = useState("");
  const [globalBackgroundColor, setGlobalBackgroundColor] = useState("#f6f1e4");
  const [globalOverlay, setGlobalOverlay] = useState(0.25);
  const [accentColor, setAccentColor] = useState("#f97316");
  const [flowPreset, setFlowPreset] = useState<FlowPreset>("serene");
  const [globalMusicUrl, setGlobalMusicUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [_version, setVersion] = useState<number | undefined>(undefined);

  const objectUrlRefs = useRef<string[]>([]);

  const availableQuestions = useMemo<FormFieldConfig[]>(
    () => serverFormFields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [serverFormFields]
  );

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedId) ?? null,
    [blocks, selectedId]
  );

  // Revoke object URLs on unmount
  useEffect(() => () => objectUrlRefs.current.forEach((url) => URL.revokeObjectURL(url)), []);

  // Sync version from save response
  useEffect(() => {
    if (saveResponse?.data?.version !== undefined) setVersion(saveResponse.data.version);
  }, [saveResponse]);

  // Load saved design from backend (once only)
  useEffect(() => {
    if (!savedDesign || isDesignLoaded) return;
    if (savedDesign.blocks?.length) setBlocks(savedDesign.blocks);
    if (savedDesign.globalBackgroundType) setGlobalBackgroundType(savedDesign.globalBackgroundType);
    if (savedDesign.globalBackgroundAsset) setGlobalBackgroundAsset(savedDesign.globalBackgroundAsset);
    if (savedDesign.globalBackgroundColor) setGlobalBackgroundColor(savedDesign.globalBackgroundColor);
    if (savedDesign.globalOverlay !== undefined) setGlobalOverlay(savedDesign.globalOverlay);
    if (savedDesign.accentColor) setAccentColor(savedDesign.accentColor);
    if (savedDesign.flowPreset) setFlowPreset(savedDesign.flowPreset);
    if (savedDesign.globalMusicUrl) setGlobalMusicUrl(savedDesign.globalMusicUrl);
    if (savedDesign.version !== undefined) setVersion(savedDesign.version);
    if (savedDesign.shareToken) {
      setShareToken(savedDesign.shareToken);
      setPublicLink(`${window.location.origin}/rsvp/submit/${savedDesign.shareToken}`);
    }
    setIsDesignLoaded(true);
  }, [savedDesign, isDesignLoaded]);

  // Re-persist localStorage snapshot on design change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (shareToken) persistShareSnapshot(shareToken);
  }, [shareToken, blocks, globalBackgroundAsset, globalBackgroundColor, globalBackgroundType, globalOverlay, accentColor, flowPreset, globalMusicUrl]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const toImageAsset = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlRefs.current.push(url);
    return { id: uid(), src: url, alt: file.name };
  };

  const persistShareSnapshot = (token: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      `rsvp-share-${token}`,
      JSON.stringify({
        eventTitle: event?.title ?? "RSVP invite",
        eventGuid: eventId ?? undefined,
        blocks,
        flowPreset,
        global: {
          backgroundColor: globalBackgroundColor,
          backgroundType: globalBackgroundType,
          backgroundAsset: globalBackgroundAsset,
          overlay: globalOverlay,
          accentColor,
          musicUrl: globalMusicUrl || undefined,
        },
        formFieldConfigs: availableQuestions,
      })
    );
  };

  // ── Block operations ───────────────────────────────────────────────────
  const addBlock = (type: RsvpBlock["type"]) => {
    const id = uid();
    const defaults: Record<RsvpBlock["type"], RsvpBlock> = {
      headline:     { id, type: "headline",     title: "Custom headline", subtitle: "Add a subheader", align: "center", accent: "text-white", background: { images: [], overlay: 0.4 } },
      text:         { id, type: "text",         body: "Tell your guests what to expect.", width: "full", align: "left", muted: false, background: { images: [], overlay: 0.4 } },
      info:         { id, type: "info",         label: "Highlight", content: "Dress code, parking, or venue info", accent: "bg-white/20 text-white border border-white/30", background: { images: [], overlay: 0.4 } },
      attendance:   { id, type: "attendance",   title: "Will you be attending?", subtitle: "Please let us know", background: { images: [], overlay: 0.4 } },
      guestDetails: { id, type: "guestDetails", title: "Your details", subtitle: "Tell us about yourself", showFields: { name: true, email: true, phone: true, pax: true, guestType: true }, background: { images: [], overlay: 0.4 } },
      formField:    { id, type: "formField",    label: "Custom field", placeholder: "Placeholder", required: false, width: "full", background: { images: [], overlay: 0.4 } },
      cta:          { id, type: "cta",          label: "Open RSVP", href: "#", align: "center", background: { images: [], overlay: 0.4 } },
      image:        { id, type: "image",        images: [], activeImageId: undefined, caption: "Add captions", height: "medium", background: { images: [], overlay: 0.4 } },
    };
    setBlocks((prev) => [...prev, defaults[type]]);
    setSelectedId(id);
  };

  const updateBlock = (blockId: string, patch: Partial<RsvpBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? ({ ...b, ...patch } as RsvpBlock) : b)));

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedId === blockId) setSelectedId(null);
  };

  const reorderBlocks = (sourceId: string, targetId: string) => {
    const si = blocks.findIndex((b) => b.id === sourceId);
    const ti = blocks.findIndex((b) => b.id === targetId);
    if (si === -1 || ti === -1 || si === ti) return;
    const next = [...blocks];
    const [moved] = next.splice(si, 1);
    next.splice(ti, 0, moved);
    setBlocks(next);
  };

  const insertQuestionBlock = (questionId: string) => {
    if (!questionId) return;
    const field = availableQuestions.find((f) => (f.id ?? f.questionId) === questionId);
    if (!field) return;
    setBlocks((prev) => {
      if (prev.some((b) => b.type === "formField" && b.questionId === questionId)) return prev;
      const id = uid();
      const block: Extract<RsvpBlock, { type: "formField" }> = {
        id,
        type: "formField",
        label: field.label || field.text || "Custom field",
        placeholder: Array.isArray(field.options) ? String(field.options[0] ?? "") : "",
        required: field.isRequired ?? false,
        width: "full",
        hint: field.typeKey ? `${field.typeKey}${field.isRequired ? " · required" : ""}` : undefined,
        questionId: field.id ?? field.questionId,
        background: { images: [], overlay: 0.4 },
      };
      setSelectedId(id);
      return [...prev, block];
    });
  };

  const applyQuestionToBlock = (blockId: string, questionId: string | undefined) => {
    if (!questionId) return;
    const field = availableQuestions.find((f) => (f.id ?? f.questionId) === questionId);
    if (!field) return;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "formField") return b;
        return {
          ...b,
          label: field.label || field.text || b.label,
          placeholder: Array.isArray(field.options) ? String(field.options[0] ?? "") : b.placeholder ?? "",
          required: field.isRequired ?? b.required ?? false,
          hint: field.typeKey ? `${field.typeKey}${field.isRequired ? " · required" : ""}` : b.hint,
          questionId,
        } as RsvpBlock;
      })
    );
  };

  // ── Image operations ───────────────────────────────────────────────────
  const handleBackgroundUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlRefs.current.push(url);
    setGlobalBackgroundAsset(url);
  };

  const handleImageUploadBlock = (files: FileList) => {
    const gallery = Array.from(files).map(toImageAsset);
    const block: RsvpBlock = {
      id: uid(),
      type: "image",
      images: gallery,
      activeImageId: gallery[0]?.id,
      caption: "Add a caption or blessing",
      height: "medium",
      background: { images: [], overlay: 0.4 },
    };
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
  };

  const addBackgroundImagesToBlock = (blockId: string, files: FileList) => {
    const gallery = Array.from(files).map(toImageAsset);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const existing = b.background?.images ?? [];
        const merged = [...existing, ...gallery];
        return {
          ...b,
          background: {
            images: merged,
            activeImageId: b.background?.activeImageId ?? merged[0]?.id,
            overlay: b.background?.overlay ?? 0.4,
          },
        } as RsvpBlock;
      })
    );
  };

  const setActiveBackgroundForBlock = (blockId: string, imageId: string) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? ({ ...b, background: { ...(b.background ?? { images: [] }), activeImageId: imageId } } as RsvpBlock)
          : b
      )
    );

  const setOverlayForBlock = (blockId: string, overlay: number) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? ({ ...b, background: { ...(b.background ?? { images: [] }), overlay } } as RsvpBlock)
          : b
      )
    );

  const setSectionImageForBlock = (blockId: string, file: File) => {
    const asset = toImageAsset(file);
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, sectionImage: asset } : b)));
  };

  const clearSectionImage = (blockId: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, sectionImage: null } : b)));

  const replaceImageForBlock = (blockId: string, file: File) => {
    const asset = toImageAsset(file);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "image") return b;
        return { ...b, images: [asset, ...b.images], activeImageId: asset.id };
      })
    );
  };

  const appendImagesToBlock = (blockId: string, files: FileList) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "image") return b;
        const nextImages = [...b.images, ...Array.from(files).map(toImageAsset)];
        return { ...b, images: nextImages, activeImageId: b.activeImageId ?? nextImages[0]?.id };
      })
    );
  };

  // ── Save + share ───────────────────────────────────────────────────────
  const handleSave = () => {
    if (!eventId) return;
    const currentDesign: RsvpDesign = {
      blocks,
      flowPreset,
      globalBackgroundType,
      globalBackgroundAsset,
      globalBackgroundColor,
      globalOverlay,
      accentColor,
      globalMusicUrl: globalMusicUrl || undefined,
      shareToken,
      publicLink,
      formFieldConfigs: availableQuestions,
    };
    saveDesign({ design: currentDesign, isPublished: false, isDraft: true, shareToken, publicLink });
  };

  const generatePublicLink = () => {
    const token = uid();
    const link = `${window.location.origin}/rsvp/submit/${token}`;
    setShareToken(token);
    setPublicLink(link);
    setLinkCopied(false);
    persistShareSnapshot(token);
  };

  const copyLink = async () => {
    if (!publicLink || !navigator.clipboard) return;
    await navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
  };

  // ── Early returns (after all hooks) ───────────────────────────────────
  if (!eventId) {
    return (
      <NoEventsState
        title="No Event for RSVP Design"
        message="Create your first event to start customizing your RSVP page design."
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <DesignToolbar
        eventName={event?.title}
        isLoadingDesign={isLoadingDesign}
        isSaving={isSaving}
        isSaveSuccess={isSaveSuccess}
        eventId={eventId}
        publicLink={publicLink}
        linkCopied={linkCopied}
        onSave={handleSave}
        onPreview={() => setShowPreview(true)}
        onGenerateLink={generatePublicLink}
        onCopyLink={copyLink}
      />

      {/* Main designer layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left: block list + add menu */}
        <div className="xl:col-span-1">
          <BlockList
            blocks={blocks}
            selectedId={selectedId}
            accentColor={accentColor}
            formFields={availableQuestions}
            isFetchingQuestions={isFetchingQuestions}
            onSelect={setSelectedId}
            onReorder={reorderBlocks}
            onAdd={addBlock}
            onUploadImages={handleImageUploadBlock}
            onInsertQuestion={insertQuestionBlock}
          />
        </div>

        {/* Right: global settings + block editor */}
        <div className="space-y-5 xl:col-span-2">
          <GlobalSettingsPanel
            globalBackgroundType={globalBackgroundType}
            globalBackgroundColor={globalBackgroundColor}
            globalOverlay={globalOverlay}
            accentColor={accentColor}
            flowPreset={flowPreset}
            globalMusicUrl={globalMusicUrl}
            hasBackgroundAsset={!!globalBackgroundAsset}
            onChange={(patch) => {
              if (patch.globalBackgroundType !== undefined) setGlobalBackgroundType(patch.globalBackgroundType);
              if (patch.globalBackgroundColor !== undefined) setGlobalBackgroundColor(patch.globalBackgroundColor);
              if (patch.globalOverlay !== undefined) setGlobalOverlay(patch.globalOverlay);
              if (patch.accentColor !== undefined) setAccentColor(patch.accentColor);
              if (patch.flowPreset !== undefined) setFlowPreset(patch.flowPreset);
              if (patch.globalMusicUrl !== undefined) setGlobalMusicUrl(patch.globalMusicUrl);
            }}
            onUploadBackground={handleBackgroundUpload}
          />

          <BlockEditor
            block={selectedBlock}
            accentColor={accentColor}
            formFields={availableQuestions}
            onUpdate={updateBlock}
            onRemove={removeBlock}
            onAddBackgroundImages={addBackgroundImagesToBlock}
            onSetActiveBackground={setActiveBackgroundForBlock}
            onSetOverlay={setOverlayForBlock}
            onSetSectionImage={setSectionImageForBlock}
            onClearSectionImage={clearSectionImage}
            onReplaceImage={replaceImageForBlock}
            onAppendImages={appendImagesToBlock}
            onApplyQuestion={applyQuestionToBlock}
          />
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Preview</p>
                <p className="text-lg font-bold text-gray-800">{event?.title ?? "Your RSVP invite"}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden gap-1 rounded-full bg-gray-100 p-1 text-sm md:flex">
                  {(["mobile", "desktop"] as const).map((m) => (
                    <button
                      key={m}
                      className={`rounded-full px-3 py-1 font-semibold capitalize transition ${
                        previewMode === m ? "bg-white shadow" : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setPreviewMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex justify-center p-6">
              <PhonePreview
                blocks={blocks}
                backgroundAsset={globalBackgroundAsset}
                backgroundColor={globalBackgroundColor}
                backgroundType={globalBackgroundType}
                overlay={globalOverlay}
                accentColor={accentColor}
                mode={previewMode}
                flowPreset={flowPreset}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
