// designer/BlockPreviewCard.tsx
// Compact draggable card shown in the left block list for each RSVP block.
import React from "react";
import type { RsvpBlock } from "../../../../types/rsvpDesign";

const BLOCK_LABEL: Record<RsvpBlock["type"], string> = {
  headline: "Headline",
  text: "Paragraph",
  info: "Info badge",
  formField: "Form field",
  cta: "CTA button",
  image: "Image gallery",
  attendance: "Attendance",
  guestDetails: "Guest details",
};

const BLOCK_ICON: Record<RsvpBlock["type"], string> = {
  headline: "H",
  text: "T",
  info: "i",
  formField: "✎",
  cta: "→",
  image: "🖼",
  attendance: "✓",
  guestDetails: "👤",
};

// Brief one-line preview for each block type
function getBlockPreview(block: RsvpBlock): string {
  switch (block.type) {
    case "headline":   return block.title || "Untitled headline";
    case "text":       return block.body   || "Empty paragraph";
    case "info":       return block.label  ? `${block.label}: ${block.content}` : "Info badge";
    case "formField":  return block.label  || "Custom form field";
    case "cta":        return block.label  || "CTA button";
    case "image":      return block.images?.length ? `${block.images.length} image(s)` : "No images yet";
    case "attendance": return block.title  || "Will you be attending?";
    case "guestDetails": return block.title || "Your details";
    default:           return "";
  }
}

interface Props {
  block: RsvpBlock;
  isSelected: boolean;
  accentColor: string;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function BlockPreviewCard({
  block,
  isSelected,
  accentColor,
  onSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
}: Props) {
  const thumb =
    block.background?.images.find((img) => img.id === block.background?.activeImageId) ??
    block.background?.images?.[0] ??
    (block.type === "image" ? (block.images.find((img) => img.id === block.activeImageId) ?? block.images[0]) : undefined);

  const bgCount = block.background?.images.length ?? 0;
  const preview = getBlockPreview(block);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`group flex cursor-grab items-center gap-3 rounded-xl border px-3 py-2.5 transition active:cursor-grabbing ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {/* Drag grip */}
      <div className="flex flex-shrink-0 flex-col items-center gap-0.5 opacity-30 group-hover:opacity-60">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-0.5">
            <div className="h-1 w-1 rounded-full bg-gray-500" />
            <div className="h-1 w-1 rounded-full bg-gray-500" />
          </div>
        ))}
      </div>

      {/* Block type icon */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
        style={{ background: isSelected ? accentColor : "#94a3b8" }}
        title={BLOCK_LABEL[block.type]}
      >
        {BLOCK_ICON[block.type]}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800 truncate">
            {BLOCK_LABEL[block.type]}
          </span>
          {bgCount > 0 && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              {bgCount} bg
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-400">{preview}</p>
      </div>

      {/* Thumbnail — only if image is set */}
      {thumb ? (
        <img
          src={thumb.src}
          alt={thumb.alt ?? ""}
          className="h-11 w-11 flex-shrink-0 rounded-lg object-cover ring-1 ring-gray-200"
        />
      ) : (
        <div className="h-11 w-11 flex-shrink-0 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-300">
          {BLOCK_ICON[block.type]}
        </div>
      )}
    </div>
  );
}
