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
    })
  | (RsvpBlockBase & {
      type: "text";
      body: string;
      width: "full" | "half"; // String values
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
      };
      cardColor?: string;      // background color of the input card (default #ffffff)
      cardTextColor?: string;  // text color inside the input card (default #111827)
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
  eventGuid?: string;           // Needed by guest page to fetch form fields
  version?: number;             // Backend-managed version number, needed for publish
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
