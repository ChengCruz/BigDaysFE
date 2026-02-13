import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../atoms/Button";
import { useEventContext } from "../../../context/EventContext";
import { useFormFields, type FormFieldConfig } from "../../../api/hooks/useFormFieldsApi";
import { useRsvpDesign, useSaveRsvpDesign } from "../../../api/hooks/useRsvpDesignApi";
import type { RsvpDesign } from "../../../types/rsvpDesign";

// Types for flexible RSVP card blocks
 type BlockMedia = { id: string; src: string; alt?: string };
 export type FlowPreset = "serene" | "parallax" | "stacked";

 type BlockBackground = {
  images: BlockMedia[];
  activeImageId?: string;
  overlay?: number;
};

 type RsvpBlockBase = {
  id: string;
  background?: BlockBackground;
  sectionImage?: BlockMedia | null;
};

 export type RsvpBlock =
  | (RsvpBlockBase & {
      type: "headline";
      title: string;
      subtitle?: string;
      align: "left" | "center" | "right";
      accent: string;
    })
  | (RsvpBlockBase & {
      type: "text";
      body: string;
      width: "full" | "half";
      align: "left" | "center" | "right";
      muted?: boolean;
    })
  | (RsvpBlockBase & {
      type: "info";
      label: string;
      content: string;
      accent: string;
    })
  | (RsvpBlockBase & {
      type: "formField";
      label: string;
      placeholder?: string;
      required?: boolean;
      width: "full" | "half";
      hint?: string;
      questionId?: string;
    })
  | (RsvpBlockBase & {
      type: "cta";
      label: string;
      href?: string;
      align: "left" | "center" | "right";
    })
  | (RsvpBlockBase & {
      type: "image";
      images: BlockMedia[];
      activeImageId?: string;
      caption?: string;
      height?: "short" | "medium" | "tall";
    });

const uid = () => Math.random().toString(36).slice(2, 9);

function BlockBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: `${color}15`, color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

const renderBlockContent = (block: RsvpBlock, accentColor: string) => {
  switch (block.type) {
    case "headline":
      return (
        <div className={`text-${block.align}`.trim()}>
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">Welcome</p>
          <h2 className={`text-3xl font-extrabold text-white drop-shadow ${block.accent}`}>{block.title}</h2>
          {block.subtitle && <p className="mt-1 text-sm text-white/80">{block.subtitle}</p>}
        </div>
      );
    case "text":
      return (
        <p className={`leading-relaxed text-sm ${block.muted ? "text-white/80" : "text-white"}`}>{block.body}</p>
      );
    case "info":
      return (
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs ${block.accent}`}>
          <span className="font-semibold uppercase tracking-wide">{block.label}</span>
          <span className="text-white/80">{block.content}</span>
        </div>
      );
    case "formField":
      return (
        <div className={`space-y-2 ${block.width === "half" ? "md:w-1/2" : "w-full"}`}>
          <label className="block text-sm font-semibold text-white">
            {block.label}
            {block.required && <span className="ml-1 text-rose-200">*</span>}
          </label>
          <div className="rounded-xl border border-white/30 bg-white/20 px-3 py-2 text-white/90">
            {block.placeholder || "Your response"}
          </div>
          {block.hint && <p className="text-xs text-white/70">{block.hint}</p>}
        </div>
      );
    case "cta":
      return (
        <div className={`flex ${block.align === "center" ? "justify-center" : block.align === "right" ? "justify-end" : "justify-start"}`}>
          <button
            className="rounded-full px-6 py-2 text-sm font-semibold shadow-lg"
            style={{ background: accentColor, color: "#0f172a" }}
          >
            {block.label}
          </button>
        </div>
      );
    case "image": {
      const active = block.images.find((img) => img.id === block.activeImageId) ?? block.images[0];
      const heightClass = block.height === "tall" ? "h-72" : block.height === "short" ? "h-40" : "h-56";
      return (
        <div className={`overflow-hidden rounded-2xl border border-white/15 bg-white/5 ${heightClass}`}>
          {active ? (
            <img src={active.src} alt={active.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">Upload images to show here</div>
          )}
          {(block.caption || active?.alt) && (
            <div className="bg-black/35 px-3 py-2 text-xs text-white/80">{block.caption || active?.alt}</div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
};

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
      className={`relative overflow-hidden rounded-[28px] border border-white/30 shadow-2xl ${mode === "mobile" ? "w-[360px] max-w-full" : "w-full"} bg-gradient-to-b from-slate-900 to-black`}
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

      <div className="relative z-10 flex items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white/80 bg-black/30 backdrop-blur-sm">
        <span>{mode === "mobile" ? "Mobile" : "Desktop"} preview</span>
        <span>RSVP card</span>
      </div>

      <div
        className={`relative z-10 space-y-4 overflow-auto px-4 pb-6 pt-4 ${
          flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""
        }`}
        style={{ maxHeight: mode === "mobile" ? 640 : 720 }}
      >
        {blocks.map((block, index) => {
          const backgroundImages = block.background?.images ?? [];
          const overlayStrength = block.background?.overlay ?? 0.35;
          const fallbackBackground = block.sectionImage;
          const activeBackground =
            backgroundImages.find((img) => img.id === block.background?.activeImageId) ??
            backgroundImages[0] ??
            fallbackBackground;

          const blockAttachment = flowPreset === "parallax" ? "fixed" : "scroll";
          const accentGlow = flowPreset === "serene" ? "shadow-xl shadow-black/20" : "shadow-2xl shadow-black/30";

          return (
            <div
              key={block.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 transition duration-500 ${
                flowPreset === "stacked" ? "scroll-snap-start" : ""
              } ${flowPreset === "serene" ? "backdrop-blur" : ""}`}
              style={{
                backgroundImage: activeBackground
                  ? `linear-gradient(rgba(15,23,42,${overlayStrength}), rgba(15,23,42,${overlayStrength})), url(${activeBackground.src})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: blockAttachment,
              }}
            >
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: accentColor }} />
                  {block.type === "headline"
                    ? "Headline"
                    : block.type === "text"
                      ? "Text"
                      : block.type === "info"
                        ? "Info"
                        : block.type === "image"
                          ? "Image"
                          : block.type === "cta"
                            ? "CTA"
                            : "Form"}
                </span>
                {backgroundImages.length > 1 && <span className="rounded-full bg-black/30 px-2 py-1">{backgroundImages.length} bg</span>}
              </div>

              <div
                className={`space-y-3 text-white transition duration-500 ${accentGlow} ${
                  flowPreset === "parallax" ? "group-hover:translate-y-[-2px]" : "group-hover:translate-y-[-1px]"
                }`}
                style={{ transitionDelay: `${index * 30}ms` }}
              >
                {renderBlockContent(block, accentColor)}
              </div>

              {backgroundImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-[10px] text-white/80">
                  {backgroundImages.map((img) => (
                    <div key={img.id} className={`h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border ${block.background?.activeImageId === img.id ? "border-white" : "border-white/30"}`}>
                      <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-950/85 to-slate-950" style={{ background: `rgba(15,23,42,${overlay})` }} />
      </div>

      <div
        className={`relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12 ${
          flowPreset === "stacked" ? "scroll-snap-y scroll-smooth" : ""
        }`}
      >
        {blocks.map((block, index) => {
          const backgroundImages = block.background?.images ?? [];
          const fallbackBackground = block.sectionImage;
          const activeBackground =
            backgroundImages.find((img) => img.id === block.background?.activeImageId) ??
            backgroundImages[0] ??
            fallbackBackground;
          const overlayStrength = block.background?.overlay ?? 0.35;

          const blockAttachment = flowPreset === "parallax" ? "fixed" : "scroll";
          const lift = flowPreset === "serene" ? "hover:-translate-y-1" : "hover:-translate-y-2";

          return (
            <section
              key={block.id}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/5 transition duration-500 ${
                flowPreset === "stacked" ? "scroll-snap-start" : ""
              } ${lift}`}
              style={{
                backgroundImage: activeBackground
                  ? `linear-gradient(rgba(15,23,42,${overlayStrength}), rgba(15,23,42,${overlayStrength})), url(${activeBackground.src})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: blockAttachment,
              }}
            >
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: accentColor }} />
                  {block.type === "headline"
                    ? "Headline"
                    : block.type === "text"
                      ? "Text"
                      : block.type === "info"
                        ? "Info"
                        : block.type === "image"
                          ? "Image"
                          : block.type === "cta"
                            ? "CTA"
                            : "Form"}
                </span>
                <span className="rounded-full bg-black/30 px-2 py-1 text-[10px]">
                  Scene {index + 1}
                </span>
              </div>

              <div className="space-y-4 text-white">
                {renderBlockContent(block, accentColor)}
              </div>

              {backgroundImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-[10px] text-white/80">
                  {backgroundImages.map((img) => (
                    <div key={img.id} className={`h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border ${block.background?.activeImageId === img.id ? "border-white" : "border-white/30"}`}>
                      <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function RsvpDesignPage() {
  const { event, eventId } = useEventContext() ?? {};
  const { data: serverFormFields = [], isFetching } = useFormFields(eventId, { enabled: !!eventId });
  
  // API integration for loading/saving design
  const { data: savedDesign, isLoading: isLoadingDesign } = useRsvpDesign(eventId ?? "");
  const { mutate: saveDesign, isPending: isSaving, isSuccess: isSaveSuccess, data: saveResponse } = useSaveRsvpDesign(eventId ?? "");
  
  const [availableQuestions, setAvailableQuestions] = useState<FormFieldConfig[]>([]);
  const [isDesignLoaded, setIsDesignLoaded] = useState(false);
  const [blocks, setBlocks] = useState<RsvpBlock[]>([
    {
      id: uid(),
      type: "headline",
      title: "Welcome to our wedding",
      subtitle: event?.title ?? "Save the date and RSVP below",
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
      type: "formField",
      label: "Guest name",
      placeholder: "Your full name",
      required: true,
      width: "full",
      hint: "Pulled from your RSVP questions",
      background: { images: [], overlay: 0.4 },
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [globalBackgroundType, setGlobalBackgroundType] = useState<"color" | "image" | "video">("color");
  const [globalBackgroundAsset, setGlobalBackgroundAsset] = useState<string>("");
  const [globalBackgroundColor, setGlobalBackgroundColor] = useState("#f6f1e4");
  const [globalOverlay, setGlobalOverlay] = useState(0.25);
  const [accentColor, setAccentColor] = useState("#f97316");
  const [flowPreset, setFlowPreset] = useState<FlowPreset>("serene");
  const [questionToInsert, setQuestionToInsert] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [linkCopied, setLinkCopied] = useState(false);
  const objectUrlRefs = useRef<string[]>([]);

  const selectedBlock = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);

  useEffect(() => {
    const sorted = serverFormFields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setAvailableQuestions(sorted);
  }, [serverFormFields]);

  useEffect(() => {
    const sync = () => setIsMobileViewport(window.innerWidth < 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => () => objectUrlRefs.current.forEach((url) => URL.revokeObjectURL(url)), []);

  // Update version from save response
  useEffect(() => {
    if (saveResponse?.data?.version !== undefined) {
      setVersion(saveResponse.data.version);
    }
  }, [saveResponse]);

  // Load saved design from backend when available
  useEffect(() => {
    if (savedDesign && !isDesignLoaded) {
      // Populate state with saved design
      if (savedDesign.blocks && savedDesign.blocks.length > 0) {
        setBlocks(savedDesign.blocks);
      }
      if (savedDesign.globalBackgroundType) {
        setGlobalBackgroundType(savedDesign.globalBackgroundType);
      }
      if (savedDesign.globalBackgroundAsset) {
        setGlobalBackgroundAsset(savedDesign.globalBackgroundAsset);
      }
      if (savedDesign.globalBackgroundColor) {
        setGlobalBackgroundColor(savedDesign.globalBackgroundColor);
      }
      if (savedDesign.globalOverlay !== undefined) {
        setGlobalOverlay(savedDesign.globalOverlay);
      }
      if (savedDesign.accentColor) {
        setAccentColor(savedDesign.accentColor);
      }
      if (savedDesign.flowPreset) {
        setFlowPreset(savedDesign.flowPreset);
      }
      
      // Load version from backend (needed for publish endpoint)
      if (savedDesign.version !== undefined) {
        setVersion(savedDesign.version);
      }
      
      // Load shareToken from backend and regenerate public link if available
      if (savedDesign.shareToken) {
        setShareToken(savedDesign.shareToken);
        if (typeof window !== "undefined") {
          const link = `${window.location.origin}/rsvp/share/${savedDesign.shareToken}`;
          setPublicLink(link);
        }
      }
      
      setIsDesignLoaded(true);
    }
  }, [savedDesign, isDesignLoaded]);

  const toAlign = (value: string): "left" | "center" | "right" => {
    if (value === "center" || value === "right") return value;
    return "left";
  };

  const toWidth = (value: string): "full" | "half" => (value === "half" ? "half" : "full");

  const mapFormFieldBlock = (
    field: FormFieldConfig
  ): Extract<RsvpBlock, { type: "formField" }> => ({
    id: field.id ?? field.questionId ?? uid(),
    type: "formField",
    label: field.label || field.text || "Custom field",
    placeholder:
      Array.isArray(field.options)
        ? String(field.options[0] ?? "")
        : typeof field.options === "string"
          ? field.options
          : "",
    required: field.isRequired ?? false,
    width: "full",
    hint: field.typeKey ? `${field.typeKey}${field.isRequired ? " • required" : ""}` : undefined,
    questionId: field.id ?? field.questionId,
    background: { images: [], overlay: 0.4 },
  });

  const toImageAsset = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlRefs.current.push(url);
    return { id: uid(), src: url, alt: file.name };
  };

  const reorderBlocks = (sourceId: string, targetId: string) => {
    const sourceIndex = blocks.findIndex((b) => b.id === sourceId);
    const targetIndex = blocks.findIndex((b) => b.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setBlocks(next);
  };

  const handleBackgroundUpload = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    objectUrlRefs.current.push(url);
    setGlobalBackgroundAsset(url);
  };

  const setSectionImageForBlock = (blockId: string, file?: File | null) => {
    if (!file) return;
    const asset = toImageAsset(file);
    setBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, sectionImage: asset } : block)));
  };

  const clearSectionImage = (blockId: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, sectionImage: null } : block)));
  };

  const addBackgroundImagesToBlock = (blockId: string, files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const gallery = Array.from(files).map(toImageAsset);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const existing = block.background?.images ?? [];
        const merged = [...existing, ...gallery];
        const activeImageId = block.background?.activeImageId ?? merged[0]?.id;
        return {
          ...block,
          background: {
            images: merged,
            activeImageId,
            overlay: block.background?.overlay ?? 0.4,
          },
        } as RsvpBlock;
      })
    );
  };

  const setActiveBackgroundForBlock = (blockId: string, imageId: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? ({
              ...block,
              background: {
                ...(block.background ?? { images: [] }),
                images: block.background?.images ?? [],
                activeImageId: imageId,
                overlay: block.background?.overlay ?? 0.4,
              },
            } as RsvpBlock)
          : block
      )
    );
  };

  const setOverlayForBlock = (blockId: string, overlay: number) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? ({
              ...block,
              background: {
                ...(block.background ?? { images: [] }),
                images: block.background?.images ?? [],
                activeImageId: block.background?.activeImageId,
                overlay,
              },
            } as RsvpBlock)
          : block
      )
    );
  };

  const handleImageUploadBlock = (files?: FileList | null) => {
    if (!files || files.length === 0) return;
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

  const appendImagesToBlock = (blockId: string, files?: FileList | null) => {
    if (!files || files.length === 0) return;
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== "image") return block;
        const nextImages = [...block.images, ...Array.from(files).map(toImageAsset)];
        const activeImageId = block.activeImageId ?? nextImages[0]?.id;
        return { ...block, images: nextImages, activeImageId };
      })
    );
  };

  const replaceImageForBlock = (blockId: string, file?: File | null) => {
    if (!file) return;
    const asset = toImageAsset(file);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== "image") return block;
        const nextImages = [asset, ...block.images];
        return { ...block, images: nextImages, activeImageId: asset.id };
      })
    );
  };

  const addBlock = (type: RsvpBlock["type"]) => {
    const defaults: Record<RsvpBlock["type"], RsvpBlock> = {
      headline: {
        id: uid(),
        type: "headline",
        title: "Custom headline",
        subtitle: "Add an optional subheader",
        align: "center",
        accent: "text-white",
        background: { images: [], overlay: 0.4 },
      },
      text: {
        id: uid(),
        type: "text",
        body: "Tell your guests what to expect and how to respond.",
        width: "full",
        align: "left",
        muted: false,
        background: { images: [], overlay: 0.4 },
      },
      info: {
        id: uid(),
        type: "info",
        label: "Highlight",
        content: "Dress code, parking, or live stream",
        accent: "bg-white/20 text-white border border-white/30",
        background: { images: [], overlay: 0.4 },
      },
      formField: {
        id: uid(),
        type: "formField",
        label: "Custom field",
        placeholder: "Placeholder text",
        required: false,
        width: "full",
        hint: "Use this to collect RSVP details",
        background: { images: [], overlay: 0.4 },
      },
      cta: {
        id: uid(),
        type: "cta",
        label: "Open RSVP",
        href: "#",
        align: "center",
        background: { images: [], overlay: 0.4 },
      },
      image: {
        id: uid(),
        type: "image",
        images: [],
        activeImageId: undefined,
        caption: "Add captions or blessings",
        height: "medium",
        background: { images: [], overlay: 0.4 },
      },
    };

    setBlocks((prev) => [...prev, defaults[type]]);
    setSelectedId(defaults[type].id);
  };

  const updateBlock = (id: string, patch: Partial<RsvpBlock>) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? ({ ...block, ...patch } as RsvpBlock) : block)));
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addQuestionBlock = (questionId?: string) => {
    if (!questionId) return;
    const field = availableQuestions.find((f) => (f.id ?? f.questionId) === questionId);
    if (!field) return;

    setBlocks((prev) => {
      if (prev.some((b) => b.type === "formField" && b.questionId === questionId)) return prev;
      const nextBlock = mapFormFieldBlock(field);
      setSelectedId(nextBlock.id);
      return [...prev, nextBlock];
    });
  };

  const applyQuestionToBlock = (blockId: string, questionId?: string) => {
    if (!questionId) return;
    const field = availableQuestions.find((f) => (f.id ?? f.questionId) === questionId);
    if (!field) return;

    const mapped = mapFormFieldBlock(field);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== "formField") return block;
        const updated: Extract<RsvpBlock, { type: "formField" }> = {
          ...block,
          label: mapped.label,
          placeholder: mapped.placeholder,
          required: mapped.required,
          hint: mapped.hint,
          questionId,
        };
        return updated;
      })
    );
  };

  const renderBlockIcon = (type: RsvpBlock["type"]) => {
    const map: Record<RsvpBlock["type"], string> = {
      headline: "Headline",
      text: "Paragraph",
      info: "Info",
      formField: "Form",
      cta: "CTA",
      image: "Image",
    };
    return map[type];
  };

  const questionSummary = useMemo(() => {
    if (isFetching) return "Loading questions...";
    if (availableQuestions.length === 0) return "No RSVP questions found for this event.";
    return `Loaded ${availableQuestions.length} questions from FormFieldsEndpoints.`;
  }, [availableQuestions.length, isFetching]);

  const persistShareSnapshot = (token: string) => {
    if (typeof window === "undefined") return;
    const snapshot = {
      eventTitle: event?.title ?? "RSVP invite",
      blocks,
      flowPreset,
      global: {
        backgroundColor: globalBackgroundColor,
        backgroundType: globalBackgroundType,
        backgroundAsset: globalBackgroundAsset,
        overlay: globalOverlay,
        accentColor,
      },
    };
    window.localStorage.setItem(`rsvp-share-${token}`, JSON.stringify(snapshot));
  };

  const generatePublicLink = () => {
    if (typeof window === "undefined") return;
    const token = uid();
    const link = `${window.location.origin}/rsvp/share/${token}`;
    setShareToken(token);
    setPublicLink(link);
    setLinkCopied(false);
    persistShareSnapshot(token);
  };

  useEffect(() => {
    if (!shareToken) return;
    persistShareSnapshot(shareToken);
  }, [
    shareToken,
    blocks,
    globalBackgroundAsset,
    globalBackgroundColor,
    globalBackgroundType,
    globalOverlay,
    accentColor,
    flowPreset,
  ]);

  const copyLink = async () => {
    if (!publicLink || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
  };

  // Save current design to backend
  const handleSaveDesign = () => {
    if (!eventId) return;

    const currentDesign: RsvpDesign = {
      blocks,
      flowPreset,
      globalBackgroundType,
      globalBackgroundAsset,
      globalBackgroundColor,
      globalOverlay,
      accentColor,
      shareToken,
      publicLink,
    };

    saveDesign({
      design: currentDesign,
      isPublished: false,
      isDraft: true,
      shareToken,
      publicLink,
    });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">RSVP experience designer</p>
          <h1 className="text-3xl font-bold text-primary">Design a scrollable RSVP invite</h1>
          <p className="max-w-3xl text-gray-600">
            Arrange media-backed blocks, tie existing questions, and preview a wedding invite card that guests can scroll through. Editing stays on this page—open the modal preview to see it exactly like your guests.
          </p>
          {isLoadingDesign && (
            <p className="text-sm text-blue-600">Loading saved design...</p>
          )}
          {isSaveSuccess && (
            <p className="text-sm text-green-600">Design saved successfully!</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/rsvps">
            <Button variant="secondary">Back to RSVP list</Button>
          </Link>
          <Button onClick={() => setShowPreview(true)}>Open preview</Button>
          <Button 
            onClick={handleSaveDesign} 
            disabled={isSaving || isLoadingDesign || !eventId}
          >
            {isSaving ? "Saving..." : isSaveSuccess ? "Saved!" : "Save Design"}
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Shareable preview</p>
            <p className="text-sm text-gray-600">
              Generate a random public link so guests or stakeholders can see the live form experience without entering the editor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generatePublicLink}>Generate random link</Button>
            {publicLink && (
              <a
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800"
                href={publicLink}
                target="_blank"
                rel="noreferrer"
              >
                Open as guest
              </a>
            )}
          </div>
        </div>
        {publicLink && (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center">
            <input value={publicLink} readOnly className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={copyLink}>
                {linkCopied ? "Copied" : "Copy link"}
              </Button>
              {linkCopied && <span className="text-xs font-semibold text-emerald-600">Ready to share</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Block tree + add tools */}
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm xl:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Blocks & order</h2>
            <span className="text-xs text-gray-500">Drag to reorder</span>
          </div>
          <div className="space-y-2">
            {blocks.map((block) => {
              const thumb = block.background?.images.find((img) => img.id === block.background?.activeImageId) ?? block.background?.images?.[0];
              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggingId(block.id);
                    e.dataTransfer.setData("text/plain", block.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingId && draggingId !== block.id) reorderBlocks(draggingId, block.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${selectedId === block.id ? "border-primary bg-primary/5" : "border-gray-200 bg-gray-50"}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(block.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                      <span>{renderBlockIcon(block.type)}</span>
                      <span className="text-xs text-gray-500">{block.background?.images.length ?? 0} bg</span>
                    </div>
                    {block.type === "headline" && (
                      <p className="text-xs text-gray-500 line-clamp-1">{block.title}</p>
                    )}
                    {block.type === "formField" && (
                      <p className="text-xs text-gray-500 line-clamp-1">{block.label}</p>
                    )}
                  </button>
                  {thumb ? (
                    <img src={thumb.src} alt={thumb.alt ?? ""} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed text-xs text-gray-400">
                      BG
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => addBlock("headline")}>Add headline</Button>
            <Button variant="secondary" onClick={() => addBlock("text")}>Add text</Button>
            <Button variant="secondary" onClick={() => addBlock("info")}>Add info</Button>
            <Button variant="secondary" onClick={() => addBlock("formField")}>Add form field</Button>
            <Button variant="secondary" onClick={() => addBlock("cta")}>Add CTA</Button>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-primary hover:border-primary">
              Upload images
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUploadBlock(e.target.files)} />
            </label>
          </div>

          <div className="space-y-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
            <label className="text-sm font-semibold text-gray-700">Insert RSVP question</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={questionToInsert}
                onChange={(e) => setQuestionToInsert(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select from FormFieldsEndpoints</option>
                {availableQuestions.map((q) => (
                  <option key={q.id ?? q.questionId} value={q.id ?? q.questionId}>
                    {q.label || q.text || q.name}
                  </option>
                ))}
              </select>
              <Button
                className="sm:w-auto"
                disabled={!questionToInsert}
                onClick={() => {
                  addQuestionBlock(questionToInsert);
                  setQuestionToInsert("");
                }}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">{questionSummary}</p>
          </div>
        </div>

        {/* Editor and global styles */}
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Editor</h2>
              <p className="text-sm text-gray-500">Pick a block to edit its content, gallery, and overlays.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowPreview(true)}>Preview</Button>
              <BlockBadge label="Mobile friendly" color="#f97316" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 rounded-xl border border-gray-200 p-4 lg:col-span-1">
              <h3 className="text-sm font-semibold text-gray-700">Global background</h3>
              <div className="grid grid-cols-3 gap-2 text-sm font-semibold">
                {["color", "image", "video"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGlobalBackgroundType(opt as typeof globalBackgroundType)}
                    className={`rounded-lg border px-2 py-2 ${globalBackgroundType === opt ? "border-primary text-primary" : "border-gray-200 text-gray-700"}`}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>
              {globalBackgroundType === "color" && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Background color</label>
                  <input
                    type="color"
                    value={globalBackgroundColor}
                    onChange={(e) => setGlobalBackgroundColor(e.target.value)}
                    className="h-10 w-full rounded"
                  />
                </div>
              )}
              {globalBackgroundType !== "color" && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Upload {globalBackgroundType}</label>
                  <input
                    type="file"
                    accept={globalBackgroundType === "video" ? "video/*" : "image/*"}
                    onChange={(e) => handleBackgroundUpload(e.target.files?.[0])}
                    className="w-full"
                  />
                  {globalBackgroundAsset && (
                    <p className="text-xs text-gray-500">Asset attached • {globalBackgroundType}</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Global overlay</label>
                <input
                  type="range"
                  min={0}
                  max={0.8}
                  step={0.05}
                  value={globalOverlay}
                  onChange={(e) => setGlobalOverlay(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Keeps text readable over photos or videos.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Accent color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-full rounded"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Invite flow</label>
                <div className="grid grid-cols-3 gap-2 text-sm font-semibold">
                  {["serene", "parallax", "stacked"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFlowPreset(opt as FlowPreset)}
                      className={`rounded-lg border px-2 py-2 ${flowPreset === opt ? "border-primary text-primary" : "border-gray-200 text-gray-700"}`}
                    >
                      {opt === "serene" ? "Serene" : opt === "parallax" ? "Parallax" : "Stacked"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Pick how blocks animate and snap while guests scroll.</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              {!selectedBlock && (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
                  <p className="text-lg font-semibold text-gray-700">Select a block to edit</p>
                  <p className="text-sm">Choose from the order list to the left to edit text, backgrounds, or linked questions.</p>
                </div>
              )}

              {selectedBlock && (
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Editing {renderBlockIcon(selectedBlock.type)}</h3>
                    <button onClick={() => removeBlock(selectedBlock.id)} className="text-sm font-semibold text-rose-600">
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Block background gallery</p>
                      <span className="text-xs text-gray-500">{selectedBlock.background?.images.length ?? 0} images</span>
                    </div>
                    <label className="text-sm font-medium text-gray-700">
                      Upload images for this block
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => addBackgroundImagesToBlock(selectedBlock.id, e.target.files)}
                        className="mt-1 w-full text-sm"
                      />
                    </label>
                    {selectedBlock.background?.images.length ? (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selectedBlock.background.images.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => setActiveBackgroundForBlock(selectedBlock.id, img.id)}
                            className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border ${
                              selectedBlock.background?.activeImageId === img.id ? "border-primary ring-2 ring-primary/30" : "border-gray-200"
                            }`}
                            type="button"
                          >
                            <img src={img.src} alt={img.alt ?? "Background option"} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No block-specific background yet. Add one to mirror the sample experience.</p>
                    )}
                    <div>
                      <label className="text-sm text-gray-700">Overlay strength</label>
                      <input
                        type="range"
                        min={0}
                        max={0.9}
                        step={0.05}
                        value={selectedBlock.background?.overlay ?? 0.4}
                        onChange={(e) => setOverlayForBlock(selectedBlock.id, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">Section spotlight background</p>
                      {selectedBlock.sectionImage && (
                        <button
                          type="button"
                          onClick={() => clearSectionImage(selectedBlock.id)}
                          className="text-xs font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Attach a dedicated backdrop for this block. It sits behind the content so every section carries its own hero
                      moment.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSectionImageForBlock(selectedBlock.id, e.target.files?.[0])}
                      className="w-full text-sm"
                    />
                    {selectedBlock.sectionImage && (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <img
                          src={selectedBlock.sectionImage.src}
                          alt={selectedBlock.sectionImage.alt ?? "Section image"}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {selectedBlock.type === "headline" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Title</label>
                        <input
                          value={selectedBlock.title}
                          onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Subtitle</label>
                        <input
                          value={selectedBlock.subtitle ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { subtitle: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Alignment</label>
                        <select
                          value={selectedBlock.align}
                          onChange={(e) => updateBlock(selectedBlock.id, { align: toAlign(e.target.value) })}
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Accent classes</label>
                        <input
                          value={selectedBlock.accent}
                          onChange={(e) => updateBlock(selectedBlock.id, { accent: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                          placeholder="e.g. text-white"
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "text" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Body</label>
                        <textarea
                          value={selectedBlock.body}
                          onChange={(e) => updateBlock(selectedBlock.id, { body: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-600">Width</label>
                          <select
                            value={selectedBlock.width}
                            onChange={(e) => updateBlock(selectedBlock.id, { width: toWidth(e.target.value) })}
                            className="w-full rounded-lg border px-3 py-2"
                          >
                            <option value="full">Full</option>
                            <option value="half">Half</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Alignment</label>
                          <select
                            value={selectedBlock.align}
                            onChange={(e) => updateBlock(selectedBlock.id, { align: toAlign(e.target.value) })}
                            className="w-full rounded-lg border px-3 py-2"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedBlock.muted}
                          onChange={(e) => updateBlock(selectedBlock.id, { muted: e.target.checked })}
                        />
                        <span className="text-sm text-gray-600">Use softer text tone</span>
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "info" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Label</label>
                        <input
                          value={selectedBlock.label}
                          onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Content</label>
                        <input
                          value={selectedBlock.content}
                          onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Accent classes</label>
                        <input
                          value={selectedBlock.accent}
                          onChange={(e) => updateBlock(selectedBlock.id, { accent: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                          placeholder="e.g. bg-white/20 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "formField" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Link to existing question</label>
                        <select
                          value={selectedBlock.questionId ?? ""}
                          onChange={(e) => applyQuestionToBlock(selectedBlock.id, e.target.value || undefined)}
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="">Choose a question</option>
                          {availableQuestions.map((q) => (
                            <option key={q.id ?? q.questionId} value={q.id ?? q.questionId}>
                              {q.label || q.text || q.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500">Pulled from FormFieldsEndpoints.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm text-gray-600">Label</label>
                          <input
                            value={selectedBlock.label}
                            onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm text-gray-600">Placeholder</label>
                          <input
                            value={selectedBlock.placeholder ?? ""}
                            onChange={(e) => updateBlock(selectedBlock.id, { placeholder: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-600">Width</label>
                          <select
                            value={selectedBlock.width}
                            onChange={(e) => updateBlock(selectedBlock.id, { width: toWidth(e.target.value) })}
                            className="w-full rounded-lg border px-3 py-2"
                          >
                            <option value="full">Full</option>
                            <option value="half">Half</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Required</label>
                          <select
                            value={selectedBlock.required ? "yes" : "no"}
                            onChange={(e) => updateBlock(selectedBlock.id, { required: e.target.value === "yes" })}
                            className="w-full rounded-lg border px-3 py-2"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Hint</label>
                        <input
                          value={selectedBlock.hint ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { hint: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "cta" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Label</label>
                        <input
                          value={selectedBlock.label}
                          onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Link</label>
                        <input
                          value={selectedBlock.href ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { href: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Alignment</label>
                        <select
                          value={selectedBlock.align}
                          onChange={(e) => updateBlock(selectedBlock.id, { align: toAlign(e.target.value) })}
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "image" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Caption</label>
                        <input
                          value={selectedBlock.caption ?? ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { caption: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-sm font-medium text-gray-700">
                          Replace first image
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-1 w-full"
                            onChange={(e) => replaceImageForBlock(selectedBlock.id, e.target.files?.[0])}
                          />
                        </label>
                        <label className="text-sm font-medium text-gray-700">
                          Add more images
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="mt-1 w-full"
                            onChange={(e) => appendImagesToBlock(selectedBlock.id, e.target.files)}
                          />
                        </label>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Height</label>
                        <select
                          value={selectedBlock.height ?? "medium"}
                          onChange={(e) =>
                            updateBlock(selectedBlock.id, {
                              height:
                                e.target.value === "tall" ? "tall" : e.target.value === "short" ? "short" : "medium",
                            })
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="short">Compact</option>
                          <option value="medium">Standard</option>
                          <option value="tall">Tall</option>
                        </select>
                      </div>
                      {selectedBlock.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selectedBlock.images.map((img) => (
                            <button
                              type="button"
                              key={img.id}
                              onClick={() => updateBlock(selectedBlock.id, { activeImageId: img.id })}
                              className={`h-16 w-20 overflow-hidden rounded-lg border ${selectedBlock.activeImageId === img.id ? "border-primary ring-2 ring-primary/30" : "border-gray-200"}`}
                            >
                              <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Upload multiple images to let guests scroll through each scene.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Preview</p>
                <p className="text-lg font-semibold text-gray-800">{event?.title ?? "Your RSVP invite"}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden gap-2 rounded-full bg-gray-100 p-1 text-sm font-semibold text-gray-700 md:flex">
                  <button
                    className={`rounded-full px-3 py-1 ${previewMode === "mobile" ? "bg-white shadow" : ""}`}
                    onClick={() => setPreviewMode("mobile")}
                  >
                    Mobile
                  </button>
                  <button
                    className={`rounded-full px-3 py-1 ${previewMode === "desktop" ? "bg-white shadow" : ""}`}
                    onClick={() => setPreviewMode("desktop")}
                  >
                    Desktop
                  </button>
                </div>
                {isMobileViewport && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Tap blocks to scroll</span>
                )}
                <button
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 md:items-start">
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Your invite mirrors the reference layout: a scrollable gallery with per-block backgrounds, overlaid text, and RSVP questions tied directly to your event. Guests can swipe through images, read the story, and respond without leaving the card.
                </p>
                <div className="flex flex-wrap gap-2">
                  <BlockBadge label={`${blocks.length} blocks`} color="#0ea5e9" />
                  <BlockBadge label={`${blocks.reduce((acc, b) => acc + (b.background?.images.length ?? 0), 0)} background images`} color="#f97316" />
                  <BlockBadge label={`${blocks.filter((b) => b.type === "formField").length} questions`} color="#22c55e" />
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                  <li>Each block carries its own gallery so photos and copy stay paired.</li>
                  <li>RSVP fields come directly from FormFieldsEndpoints for the selected event.</li>
                  <li>Preview stays separate from editing for a clean CMS experience.</li>
                </ul>
              </div>
              <div className="flex w-full justify-center md:justify-end">
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
        </div>
      )}
    </div>
  );
}
