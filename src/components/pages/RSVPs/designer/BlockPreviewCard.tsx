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
  formField: "?",
  cta: "→",
  image: "🖼",
  attendance: "R",
  guestDetails: "U",
};

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
    block.background?.images?.[0];

  const bgCount = block.background?.images.length ?? 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`flex cursor-grab items-center gap-3 rounded-xl border px-3 py-2.5 transition active:cursor-grabbing ${
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
    >
      {/* Block type icon */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ background: accentColor }}
        title={BLOCK_LABEL[block.type]}
      >
        {BLOCK_ICON[block.type]}
      </div>

      {/* Info */}
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
          <span className="truncate">{BLOCK_LABEL[block.type]}</span>
          {bgCount > 0 && (
            <span className="ml-2 flex-shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">
              {bgCount} bg
            </span>
          )}
        </div>
        {block.type === "headline" && (
          <p className="truncate text-xs text-gray-500">{block.title}</p>
        )}
        {block.type === "text" && (
          <p className="truncate text-xs text-gray-500">{block.body}</p>
        )}
        {block.type === "info" && (
          <p className="truncate text-xs text-gray-500">{block.label}: {block.content}</p>
        )}
        {block.type === "formField" && (
          <p className="truncate text-xs text-gray-500">{block.label}</p>
        )}
        {block.type === "cta" && (
          <p className="truncate text-xs text-gray-500">{block.label}</p>
        )}
        {block.type === "image" && block.images?.length > 0 && (
          <p className="truncate text-xs text-gray-500">{block.images.length} image(s)</p>
        )}
        {block.type === "attendance" && (
          <p className="truncate text-xs text-gray-500">{block.title || "Will you be attending?"}</p>
        )}
        {block.type === "guestDetails" && (
          <p className="truncate text-xs text-gray-500">{block.title || "Your details"}</p>
        )}
      </button>

      {/* Thumbnail */}
      {thumb ? (
        <img
          src={thumb.src}
          alt={thumb.alt ?? ""}
          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
          BG
        </div>
      )}
    </div>
  );
}
