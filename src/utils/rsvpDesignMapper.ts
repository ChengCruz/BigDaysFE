// src/utils/rsvpDesignMapper.ts
// Data transformation utilities for RSVP Design feature
// Converts between Frontend UI types and Backend API payload format

import type {
  RsvpBlock,
  RsvpDesign,
  ApiRsvpDesignPayload,
  ApiRsvpDesign,
  ApiBlock,
  ApiBlockBackground,
  ApiOverlay,
} from "../types/rsvpDesign";

/**
 * Transform Frontend block to Backend block format
 */
function transformBlockToBackend(
  block: RsvpBlock,
  globalAccentColor: string
): ApiBlock {
  const base: ApiBlock = {
    id: block.id,
    type: block.type,
  };

  // Transform background if present
  if (block.background) {
    const overlay: ApiOverlay = {
      opacity: block.background.overlay ?? 0.4,
      color: "#0f172a", // Default dark overlay color
    };

    const backendBackground: ApiBlockBackground = {
      images: block.background.images.map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
      })),
      activeImageId: block.background.activeImageId,
      overlay,
    };

    base.background = backendBackground;
  }

  // Transform section image
  if (block.sectionImage) {
    base.sectionImage = {
      id: block.sectionImage.id,
      src: block.sectionImage.src,
      alt: block.sectionImage.alt,
    };
  }

  // Type-specific transformations
  switch (block.type) {
    case "headline":
      base.title = block.title;
      base.subtitle = block.subtitle;
      base.align = block.align;
      base.accentClass = block.accent; // CSS classes
      base.accentColor = globalAccentColor;
      break;

    case "text":
      base.body = block.body;
      base.width = block.width === "full" ? 100 : 50; // String → Number
      base.align = block.align;
      base.muted = block.muted;
      break;

    case "info":
      base.label = block.label;
      base.content = block.content;
      base.accentClass = block.accent;
      base.accentColor = globalAccentColor;
      break;

    case "formField":
      base.label = block.label;
      base.placeholder = block.placeholder;
      base.required = block.required;
      base.width = block.width === "full" ? 100 : 50; // String → Number
      base.hint = block.hint;
      // Preserve questionId as string GUID for round-trip
      if (block.questionId) {
        base.questionId = block.questionId;
        // Also set numeric formFieldId for legacy backends
        const numericId = parseInt(block.questionId, 10);
        base.formFieldId = isNaN(numericId) ? undefined : numericId;
      }
      break;

    case "cta":
      base.ctaLabel = block.label; // label → ctaLabel
      base.href = block.href;
      base.align = block.align;
      break;

    case "image":
      base.images = block.images.map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
      }));
      base.activeImageId = block.activeImageId;
      base.caption = block.caption;
      base.height = block.height; // Keep as string
      break;

    case "attendance":
      base.title = block.title;
      base.subtitle = block.subtitle;
      base.width = block.width === "half" ? 50 : 100;
      break;

    case "guestDetails":
      base.title = block.title;
      base.subtitle = block.subtitle;
      base.width = block.width === "half" ? 50 : 100;
      if (block.showFields) {
        base.showFields = { ...block.showFields };
      }
      break;
  }

  return base;
}

/**
 * Transform Backend block to Frontend block format
 */
function transformBlockToFrontend(block: ApiBlock): RsvpBlock {
  const baseBackground = block.background
    ? {
        images: block.background.images.map((img) => ({
          id: img.id,
          src: img.src,
          alt: img.alt,
        })),
        activeImageId: block.background.activeImageId,
        overlay: block.background.overlay?.opacity ?? 0.4,
      }
    : { images: [], overlay: 0.4 };

  const baseSectionImage = block.sectionImage
    ? {
        id: block.sectionImage.id,
        src: block.sectionImage.src,
        alt: block.sectionImage.alt,
      }
    : null;

  const base = {
    id: block.id,
    background: baseBackground,
    sectionImage: baseSectionImage,
  };

  // Type-specific transformations
  switch (block.type) {
    case "headline":
      return {
        ...base,
        type: "headline",
        title: block.title ?? "",
        subtitle: block.subtitle,
        align: (block.align as "left" | "center" | "right") ?? "center",
        accent: block.accentClass ?? "text-white",
      };

    case "text":
      return {
        ...base,
        type: "text",
        body: block.body ?? "",
        width: block.width === 50 ? "half" : "full", // Number → String
        align: (block.align as "left" | "center" | "right") ?? "left",
        muted: block.muted,
      };

    case "info":
      return {
        ...base,
        type: "info",
        label: block.label ?? "",
        content: block.content ?? "",
        accent: block.accentClass ?? "bg-white/20 text-white",
      };

    case "formField":
      return {
        ...base,
        type: "formField",
        label: block.label ?? "",
        placeholder: block.placeholder,
        required: block.required ?? false,
        width: block.width === 50 ? "half" : "full", // Number → String
        hint: block.hint,
        // Prefer string questionId (GUID), fall back to numeric formFieldId
        questionId: block.questionId ?? block.formFieldId?.toString(),
      };

    case "cta":
      return {
        ...base,
        type: "cta",
        label: block.ctaLabel ?? block.label ?? "",
        href: block.href,
        align: (block.align as "left" | "center" | "right") ?? "center",
      };

    case "image":
      return {
        ...base,
        type: "image",
        images: (block.images ?? []).map((img) => ({
          id: img.id,
          src: img.src,
          alt: img.alt,
        })),
        activeImageId: block.activeImageId,
        caption: block.caption,
        height: (block.height as "short" | "medium" | "tall") ?? "medium",
      };

    case "attendance":
      return {
        ...base,
        type: "attendance",
        title: block.title ?? "Will you be attending?",
        subtitle: block.subtitle,
        width: block.width === 50 ? "half" : "full",
      };

    case "guestDetails":
      return {
        ...base,
        type: "guestDetails",
        title: block.title ?? "Your details",
        subtitle: block.subtitle,
        width: block.width === 50 ? "half" : "full",
        showFields: (block.showFields as Record<string, boolean>) ?? {
          name: true,
          email: true,
          phone: true,
          pax: true,
          guestType: true,
        },
      };

    default:
      // Fallback for unknown types
      return {
        ...base,
        type: "text",
        body: "Unknown block type",
        width: "full",
        align: "left",
      };
  }
}

/**
 * Transform Frontend design state to Backend API payload
 * Note: eventId and version are NOT included in nested design object for POST
 * (backend manages these fields, they only appear in GET responses)
 */
export function mapToBackendPayload(
  frontendDesign: RsvpDesign,
  eventId: string,
  _shareToken?: string | null,
  _publicLink?: string | null,
  isPublished: boolean = false,
  isDraft: boolean = true
): ApiRsvpDesignPayload {
  return {
    eventId,
    design: {
      theme: {
        accentColor: frontendDesign.accentColor,
        background: {
          type: frontendDesign.globalBackgroundType,
          color: frontendDesign.globalBackgroundColor,
          assetUrl: frontendDesign.globalBackgroundAsset,
        },
        overlayOpacity: frontendDesign.globalOverlay,
        musicUrl: frontendDesign.globalMusicUrl ?? undefined,
      },
      layout: {
        width: 1200, // Default layout width
        maxHeight: 0, // 0 = no max height (responsive)
      },
      previewModes: ["mobile", "desktop"],
      blocks: frontendDesign.blocks.map((block) =>
        transformBlockToBackend(block, frontendDesign.accentColor)
      ),
      flowPreset: frontendDesign.flowPreset,
      formFieldConfigs: frontendDesign.formFieldConfigs,
    },
    isPublished,
    isDraft,
  };
}

/**
 * Transform Backend API response to Frontend design state
 * Handles both ApiRsvpDesignPayload and ApiRsvpDesign formats
 */
export function mapToFrontendDesign(
  backendPayload: ApiRsvpDesignPayload | ApiRsvpDesign
): Partial<RsvpDesign> {
  const { design } = backendPayload;
  
  // Extract version and shareToken if present (from API response)
  const version = 'version' in backendPayload ? backendPayload.version : undefined;
  const shareToken = 'shareToken' in backendPayload ? backendPayload.shareToken : undefined;

  const eventGuid = 'eventGuid' in backendPayload ? (backendPayload as ApiRsvpDesign).eventGuid : undefined;

  return {
    blocks: design.blocks.map(transformBlockToFrontend),
    flowPreset:
      (design.flowPreset as "serene" | "parallax" | "stacked") ?? "serene",
    globalBackgroundType:
      (design.theme.background.type as "color" | "image" | "video") ?? "color",
    globalBackgroundAsset: design.theme.background.assetUrl ?? "",
    globalBackgroundColor: design.theme.background.color ?? "#f6f1e4",
    globalOverlay: design.theme.overlayOpacity ?? 0.25,
    accentColor: design.theme.accentColor ?? "#f97316",
    globalMusicUrl: design.theme.musicUrl ?? undefined,
    eventGuid,           // Preserved so the guest page can fetch form fields
    version,             // Store backend-managed version for publish endpoint
    shareToken: shareToken ?? null,
    publicLink: null,    // Public link is generated client-side
    formFieldConfigs: design.formFieldConfigs,
  };
}

/**
 * Validate if a design payload is complete
 */
export function validateDesignPayload(
  design: Partial<RsvpDesign>
): boolean {
  if (!design.blocks || design.blocks.length === 0) {
    return false;
  }

  if (!design.accentColor || !design.globalBackgroundColor) {
    return false;
  }

  return true;
}

/**
 * Create default design state (used for initialization)
 */
export function createDefaultDesign(eventTitle?: string): Partial<RsvpDesign> {
  const uid = () => Math.random().toString(36).slice(2, 9);

  return {
    blocks: [
      {
        id: uid(),
        type: "headline",
        title: "Welcome to our wedding",
        subtitle: eventTitle ?? "Save the date and RSVP below",
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
    ],
    flowPreset: "serene",
    globalBackgroundType: "color",
    globalBackgroundAsset: "",
    globalBackgroundColor: "#f6f1e4",
    globalOverlay: 0.25,
    accentColor: "#f97316",
  };
}
