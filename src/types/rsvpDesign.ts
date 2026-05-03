// src/types/rsvpDesign.ts
// Type definitions for RSVP Design feature
// Maps between Frontend UI types and Backend API types

/**
 * FRONTEND TYPES (Used in RsvpDesignPage)
 * ========================================
 */

export type BlockMedia = { 
  id: string; 
  src: string; 
  alt?: string 
};

export type FlowPreset = "serene" | "parallax" | "stacked";

export type BlockBackground = {
  images: BlockMedia[];
  activeImageId?: string;
  overlay?: number; // Simple number (0-1)
};

export type RsvpBlockBase = {
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
      accent: string; // CSS classes like "text-white"
      fontFamily?: string;
    })
  | (RsvpBlockBase & {
      type: "text";
      body: string;
      width: "full" | "half"; // String values
      align: "left" | "center" | "right";
      muted?: boolean;
      fontFamily?: string;
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
      width: "full" | "half"; // String values
      hint?: string;
      questionId?: string; // String GUID
      fieldCardColor?: string;      // card background (default #ffffff)
      fieldCardTextColor?: string;  // card text/label color (default #111827)
    })
  | (RsvpBlockBase & {
      type: "cta";
      label: string;
      href?: string;
      align: "left" | "center" | "right";
      ctaColor?: string;     // button background (defaults to accentColor)
      ctaTextColor?: string; // button text color (default #0f172a)
    })
  | (RsvpBlockBase & {
      type: "image";
      images: BlockMedia[];
      activeImageId?: string;
      caption?: string;
      height?: "short" | "medium" | "tall"; // String values
    })
  | (RsvpBlockBase & {
      type: "attendance";
      title?: string;       // "Will you be attending?"
      subtitle?: string;    // "Please let us know"
      width?: "full" | "half";
    })
  | (RsvpBlockBase & {
      type: "guestDetails";
      title?: string;       // "Your details"
      subtitle?: string;
      width?: "full" | "half";
      showFields?: {
        name?: boolean;
        phone?: boolean;
        pax?: boolean;
        remarks?: boolean;
      };
      cardColor?: string;      // background color of the input card (default #ffffff)
      cardTextColor?: string;  // text color inside the input card (default #111827)
      /** Custom questions rendered INSIDE the guest details card, after the built-in fields.
       *  Each entry mirrors a `formField` block but is owned by this block. */
      customQuestions?: Array<{
        id: string;            // local UID (used as React key)
        questionId?: string;   // linked RSVP form-field GUID
        label?: string;
        placeholder?: string;
        required?: boolean;
        hint?: string;
      }>;
    })
  // ── V2 event-linked block types ──────────────────────────────────────────
  | (RsvpBlockBase & {
      type: "eventDetails";
      title?: string;          // section heading override
      showDate?: boolean;      // default true
      showTime?: boolean;      // default true
      showLocation?: boolean;  // default true
    })
  | (RsvpBlockBase & {
      type: "countdown";
      label?: string;          // e.g. "Counting down to our big day"
      targetDate?: string;     // ISO date override; falls back to event.date
    })
  | (RsvpBlockBase & {
      type: "map";
      address?: string;        // text address override; falls back to event.location
      mapLabel?: string;       // e.g. "Venue"
      showDirections?: boolean; // show "Get Directions" link, default true
    });

export interface RsvpDesign {
  blocks: RsvpBlock[];
  flowPreset: FlowPreset;
  globalBackgroundType: "color" | "image" | "video";
  globalBackgroundAsset: string;
  globalBackgroundColor: string;
  globalOverlay: number;
  accentColor: string;
  /** Optional ambient background music URL shown to guests as a floating player */
  globalMusicUrl?: string;
  /** Submit button customization */
  submitButtonColor?: string;
  submitButtonTextColor?: string;
  submitButtonLabel?: string;
  /** Global font family applied to the whole design canvas */
  globalFontFamily?: string;
  /** Layout style: "cards" (V1/V2 default) renders blocks in rounded cards with gaps.
   *  "flush" (V3) renders blocks as full-width sections edge-to-edge. */
  layoutStyle?: "cards" | "flush";
  /** Content width of the guest page: controls max-width of the form container.
   *  "compact" ≈ phone (24rem), "standard" (32rem), "wide" (42rem), "full" (no limit). */
  contentWidth?: "compact" | "standard" | "wide" | "full";
  /** Horizontal inset (px) applied to the content column in canvas/preview/public.
   *  0 = edge-to-edge (default). Useful for giving blocks breathing room against the page background. */
  blockMarginX?: number;
  /** Vertical gap (px) between consecutive blocks in canvas/preview/public.
   *  0 = flush / no gap (default). */
  blockMarginY?: number;
  eventGuid?: string;           // Needed by guest page to fetch form fields
  version?: number;             // Backend-managed version number, needed for publish
  isPublished?: boolean;        // Server-owned published flag (surfaced for UI badge)
  shareToken?: string | null;
  publicLink?: string | null;
  /** Embedded form field definitions so the public page is self-contained (no auth needed) */
  formFieldConfigs?: import("../api/hooks/useFormFieldsApi").FormFieldConfig[];
}

/**
 * BACKEND API TYPES (API Payload Structure)
 * ==========================================
 */

export interface ApiBlockMedia {
  id: string;
  src: string;
  alt?: string;
}

export interface ApiOverlay {
  opacity: number;
  color: string;
}

export interface ApiBlockBackground {
  images: ApiBlockMedia[];
  activeImageId?: string;
  overlay?: ApiOverlay; // Object with opacity + color
}

export interface ApiShareInfo {
  token: string;
  link: string;
}

export interface ApiBlock {
  id: string;
  type: string;
  
  // Headline fields
  title?: string;
  subtitle?: string;
  
  // Alignment
  align?: string;
  
  // Accent styling (split from frontend)
  accentClass?: string;
  accentColor?: string;
  
  // Text fields
  body?: string;
  width?: number; // Numeric value instead of string
  muted?: boolean;
  
  // Info fields
  label?: string;
  content?: string;
  
  // Image fields
  images?: ApiBlockMedia[];
  activeImageId?: string;
  caption?: string;
  height?: string;
  
  // Form field
  formFieldId?: number; // Numeric ID (legacy)
  questionId?: string;  // String GUID — primary identifier
  placeholder?: string;
  required?: boolean;
  hint?: string;
  typeKey?: string;
  
  // CTA fields
  ctaLabel?: string;
  href?: string;
  ctaColor?: string;
  ctaTextColor?: string;
  
  // Section background
  sectionImage?: ApiBlockMedia | null;
  background?: ApiBlockBackground;
  
  // Guest details field toggles
  showFields?: Record<string, boolean>;

  // Guest details — custom questions embedded inside the block
  customQuestions?: Array<{
    id: string;
    questionId?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    hint?: string;
  }>;

  // Card / field appearance colors (guestDetails + formField)
  cardColor?: string;
  cardTextColor?: string;
  fieldCardColor?: string;
  fieldCardTextColor?: string;

  // Share info
  share?: ApiShareInfo;
}

export interface ApiTheme {
  accentColor: string;
  background: {
    type: string;
    color: string;
    assetUrl: string;
  };
  overlayOpacity: number;
  musicUrl?: string;
  submitButtonColor?: string;
  submitButtonTextColor?: string;
  submitButtonLabel?: string;
  fontFamily?: string;
  /** Layout style stored inside theme so the backend persists it */
  layoutStyle?: string;
  /** Content width preset stored inside theme so the backend persists it */
  contentWidth?: string;
  /** Horizontal inset (px) for the content column */
  blockMarginX?: number;
  /** Vertical gap (px) between consecutive blocks */
  blockMarginY?: number;
}

export interface ApiLayout {
  width: number;
  maxHeight: number;
}

export interface ApiDesign {
  eventId?: string; // GUID nested in design object
  version?: number;
  theme: ApiTheme;
  layout: ApiLayout;
  previewModes: string[];
  blocks: ApiBlock[];
  flowPreset: string;
  /** Layout style: "cards" (default) or "flush" (V3 edge-to-edge) */
  layoutStyle?: string;
  /** Content width preset for the guest page */
  contentWidth?: string;
  /** Embedded form field configs so guest page needs no auth */
  formFieldConfigs?: import("../api/hooks/useFormFieldsApi").FormFieldConfig[];
}

export interface ApiRsvpDesignPayload {
  eventId: string;
  design: ApiDesign;
  isPublished: boolean;
  isDraft: boolean;
}

// Full API response structure from backend
export interface ApiRsvpDesign {
  rsvpDesignId: number;
  eventId: number; // Numeric event ID
  eventGuid: string;
  version: number;
  design: ApiDesign;
  isPublished: boolean;
  isDraft: boolean;
  shareToken?: string | null;
  createdDate?: string;
  lastUpdated?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ApiRsvpDesignResponse {
  success: boolean;
  message?: string;
  statusCode?: string;
  code?: number;
  data?: ApiRsvpDesign;
}

/**
 * FIELD MAPPING REFERENCE
 * ========================
 * 
 * Frontend → Backend Transformations:
 * 
 * 1. Block width: "full" | "half" → 100 | 50
 * 2. Block accent: "text-white" → accentClass: "text-white", accentColor: globalAccent
 * 3. Block overlay: number → { opacity: number, color: "#0f172a" }
 * 4. Form questionId: string GUID → formFieldId: number
 * 5. CTA label: string → ctaLabel: string
 * 6. Default layout: → { width: 1200, maxHeight: 0 }
 * 7. Default previewModes: → ["mobile", "desktop"]
 * 8. Default flags: → isPublished: false, isDraft: true
 */
