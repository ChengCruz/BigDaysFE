// designer/BlockEditor.tsx
// Right panel: editor for the currently selected RSVP design block.
// Structure: Content settings → Background gallery → Spotlight image
import React, { useState } from "react";

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Georgia",            value: "Georgia, 'Times New Roman', serif" },
  { label: "Playfair Display",   value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lato",               value: "Lato, system-ui, sans-serif" },
  { label: "Montserrat",         value: "Montserrat, system-ui, sans-serif" },
  { label: "System (Modern)",    value: "system-ui, sans-serif" },
];
import { ChevronDownIcon } from "@heroicons/react/outline";
import type { RsvpBlock } from "../../../../types/rsvpDesign";
import type { FormFieldConfig } from "../../../../api/hooks/useFormFieldsApi";

interface Props {
  block: RsvpBlock | null;
  accentColor: string;
  formFields: FormFieldConfig[];
  onUpdate: (id: string, patch: Partial<RsvpBlock>) => void;
  onRemove: (id: string) => void;
  onAddBackgroundImages: (blockId: string, files: FileList) => void;
  onSetActiveBackground: (blockId: string, imageId: string) => void;
  onSetOverlay: (blockId: string, overlay: number) => void;
  onRemoveBackgroundImage: (blockId: string, imageId: string) => void;
  onSetSectionImage: (blockId: string, file: File) => void;
  onClearSectionImage: (blockId: string) => void;
  onReplaceImage: (blockId: string, file: File) => void;
  onAppendImages: (blockId: string, files: FileList) => void;
  onApplyQuestion: (blockId: string, questionId: string | undefined) => void;
}

// ── Utilities ──────────────────────────────────────────────────────────────

const toAlign = (v: string): "left" | "center" | "right" =>
  v === "center" || v === "right" ? v : "left";

const toWidth = (v: string): "full" | "half" => (v === "half" ? "half" : "full");

// ── Sub-components ─────────────────────────────────────────────────────────

const SectionHeader = ({
  icon,
  title,
  note,
  open,
  onToggle,
}: {
  icon: string;
  title: string;
  note?: string;
  open: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition hover:bg-gray-100"
  >
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">{title}</span>
      {note && <span className="text-[10px] text-gray-400">{note}</span>}
    </div>
    <ChevronDownIcon
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
    />
  </button>
);

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
  </div>
);

const ColorField = ({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value?: string;
  defaultValue: string;
  onChange: (v: string) => void;
}) => (
  <Field label={label}>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value ?? defaultValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-14 cursor-pointer rounded-lg border border-gray-200 p-0.5"
      />
      <span className="font-mono text-xs text-gray-500">{value ?? defaultValue}</span>
      {value && value !== defaultValue && (
        <button
          type="button"
          onClick={() => onChange(defaultValue)}
          className="text-[10px] text-gray-400 underline hover:text-gray-600"
        >
          reset
        </button>
      )}
    </div>
  </Field>
);

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition";

const BLOCK_TYPE_LABEL: Record<string, string> = {
  headline: "Headline",
  text: "Paragraph",
  info: "Info badge",
  formField: "Form field",
  cta: "CTA button",
  image: "Image gallery",
  attendance: "Attendance",
  guestDetails: "Guest details",
};

const BLOCK_TYPE_ICON: Record<string, string> = {
  headline: "H",
  text: "T",
  info: "i",
  formField: "✎",
  cta: "→",
  image: "🖼",
  attendance: "✓",
  guestDetails: "👤",
};

// ── Main component ──────────────────────────────────────────────────────────

export function BlockEditor({
  block,
  accentColor,
  formFields,
  onUpdate,
  onRemove,
  onAddBackgroundImages,
  onSetActiveBackground,
  onSetOverlay,
  onRemoveBackgroundImage,
  onSetSectionImage,
  onClearSectionImage,
  onReplaceImage,
  onAppendImages,
  onApplyQuestion,
}: Props) {
  const [bgOpen, setBgOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  if (!block) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-2xl">
          ←
        </div>
        <p className="text-sm font-semibold text-gray-700">Select a block to edit</p>
        <p className="mt-1 text-xs text-gray-400">
          Pick any block from the list on the left to customise its content, colors, and background.
        </p>
      </div>
    );
  }

  const bgImages = block.background?.images ?? [];
  const overlayStrength = block.background?.overlay ?? 0.4;
  const bgNote = bgImages.length > 0 ? `${bgImages.length} image${bgImages.length !== 1 ? "s" : ""}` : undefined;
  const spotlightNote = block.sectionImage ? "1 image set" : undefined;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm shrink-0"
            style={{ background: accentColor }}
          >
            {BLOCK_TYPE_ICON[block.type] ?? block.type[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Editing block</p>
            <h3 className="text-sm font-bold text-gray-800 leading-tight">
              {BLOCK_TYPE_LABEL[block.type] ?? block.type}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 hover:border-rose-200"
        >
          Remove
        </button>
      </div>

      <div className="space-y-4 p-5">

        {/* ══════════════════════════════════════════════════════════════
            CONTENT SETTINGS (block-type specific)
        ═══════════════════════════════════════════════════════════════ */}

        {/* ── Headline ── */}
        {block.type === "headline" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Title">
                <textarea
                  value={block.title}
                  onChange={(e) => onUpdate(block.id, { title: e.target.value })}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Welcome to our wedding"
                />
              </Field>
              <Field label="Subtitle (optional)">
                <textarea
                  value={block.subtitle ?? ""}
                  onChange={(e) => onUpdate(block.id, { subtitle: e.target.value })}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Save the date…"
                />
              </Field>
              <Field label="Alignment">
                <select
                  value={block.align}
                  onChange={(e) => onUpdate(block.id, { align: toAlign(e.target.value) })}
                  className={inputCls}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
              <Field label="Accent CSS classes" hint="e.g. text-white, text-yellow-200">
                <input
                  value={block.accent}
                  onChange={(e) => onUpdate(block.id, { accent: e.target.value })}
                  className={inputCls}
                  placeholder="text-white"
                />
              </Field>
              <Field label="Font">
                <select
                  value={block.fontFamily ?? "Georgia, 'Times New Roman', serif"}
                  onChange={(e) => onUpdate(block.id, { fontFamily: e.target.value } as Partial<RsvpBlock>)}
                  className={inputCls}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <p
                  className="text-sm mt-1.5 px-1 text-gray-500 truncate"
                  style={{ fontFamily: block.fontFamily ?? "Georgia, 'Times New Roman', serif" }}
                >
                  The quick brown fox jumps
                </p>
              </Field>
            </div>
          </div>
        )}

        {/* ── Text ── */}
        {block.type === "text" && (
          <div className="space-y-3">
            <Field label="Body text">
              <textarea
                value={block.body}
                onChange={(e) => onUpdate(block.id, { body: e.target.value })}
                className={`${inputCls} resize-y`}
                rows={5}
                placeholder="Tell your story…"
              />
            </Field>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Width">
                <select
                  value={block.width}
                  onChange={(e) => onUpdate(block.id, { width: toWidth(e.target.value) })}
                  className={inputCls}
                >
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </select>
              </Field>
              <Field label="Alignment">
                <select
                  value={block.align}
                  onChange={(e) => onUpdate(block.id, { align: toAlign(e.target.value) })}
                  className={inputCls}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={!!block.muted}
                onChange={(e) => onUpdate(block.id, { muted: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <span className="text-sm text-gray-600">Use softer / muted text tone</span>
            </label>
            <Field label="Font">
              <select
                value={block.fontFamily ?? ""}
                onChange={(e) => onUpdate(block.id, { fontFamily: e.target.value || undefined } as Partial<RsvpBlock>)}
                className={inputCls}
              >
                <option value="">Default (inherited)</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {block.fontFamily && (
                <p
                  className="text-sm mt-1.5 px-1 text-gray-500 truncate"
                  style={{ fontFamily: block.fontFamily }}
                >
                  The quick brown fox jumps
                </p>
              )}
            </Field>
          </div>
        )}

        {/* ── Info badge ── */}
        {block.type === "info" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Label">
                <input
                  value={block.label}
                  onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                  className={inputCls}
                  placeholder="Date"
                />
              </Field>
              <Field label="Content">
                <input
                  value={block.content}
                  onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                  className={inputCls}
                  placeholder="Saturday, 15 March 2025"
                />
              </Field>
            </div>
            <Field label="Accent CSS classes" hint="e.g. bg-white/20 text-white border border-white/30">
              <input
                value={block.accent}
                onChange={(e) => onUpdate(block.id, { accent: e.target.value })}
                className={inputCls}
                placeholder="bg-white/20 text-white border border-white/30"
              />
            </Field>
          </div>
        )}

        {/* ── Form field ── */}
        {block.type === "formField" && (
          <div className="space-y-4">
            {/* Link to question */}
            <Field label="Link to RSVP question">
              <select
                value={block.questionId ?? ""}
                onChange={(e) => onApplyQuestion(block.id, e.target.value || undefined)}
                className={inputCls}
              >
                <option value="">— Choose a question —</option>
                {formFields.map((q) => (
                  <option key={q.id ?? q.questionId} value={q.id ?? q.questionId}>
                    {q.label || q.text || q.name}
                    {q.isRequired ? " *" : ""}
                    {q.typeKey ? ` (${q.typeKey})` : ""}
                  </option>
                ))}
              </select>
              {block.questionId ? (
                <p className="text-xs text-emerald-600 mt-1">✓ Linked to question.</p>
              ) : (
                <p className="text-xs text-amber-600 mt-1">Select a question to activate this field.</p>
              )}
            </Field>

            {/* Field details */}
            <div className="grid grid-cols-1 gap-3">
              <Field label="Label override">
                <input
                  value={block.label}
                  onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                  className={inputCls}
                  placeholder="Leave blank to use question label"
                />
              </Field>
              <Field label="Placeholder">
                <input
                  value={block.placeholder ?? ""}
                  onChange={(e) => onUpdate(block.id, { placeholder: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Width">
                <select
                  value={block.width}
                  onChange={(e) => onUpdate(block.id, { width: toWidth(e.target.value) })}
                  className={inputCls}
                >
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </select>
              </Field>
              <Field label="Required">
                <select
                  value={block.required ? "yes" : "no"}
                  onChange={(e) => onUpdate(block.id, { required: e.target.value === "yes" })}
                  className={inputCls}
                >
                  <option value="yes">Required</option>
                  <option value="no">Optional</option>
                </select>
              </Field>
            </div>
            <Field label="Hint text (shown below the field)">
              <input
                value={block.hint ?? ""}
                onChange={(e) => onUpdate(block.id, { hint: e.target.value })}
                className={inputCls}
                placeholder="e.g. Dietary restrictions or special requests"
              />
            </Field>

            {/* Field appearance */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Field appearance</p>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Card background"
                  value={block.fieldCardColor}
                  defaultValue="#ffffff"
                  onChange={(v) => onUpdate(block.id, { fieldCardColor: v } as Partial<RsvpBlock>)}
                />
                <ColorField
                  label="Card text color"
                  value={block.fieldCardTextColor}
                  defaultValue="#111827"
                  onChange={(v) => onUpdate(block.id, { fieldCardTextColor: v } as Partial<RsvpBlock>)}
                />
              </div>
              {/* Live preview */}
              <div
                className="rounded-lg px-3 py-2.5 text-xs shadow-sm space-y-1.5"
                style={{
                  backgroundColor: block.fieldCardColor ?? "#ffffff",
                  color: block.fieldCardTextColor ?? "#111827",
                }}
              >
                <p className="font-medium">{block.label || "Field label"}{block.required ? " *" : ""}</p>
                <div
                  className="rounded border px-2 py-1.5 text-[11px] opacity-60"
                  style={{ borderColor: `${block.fieldCardTextColor ?? "#111827"}30` }}
                >
                  {block.placeholder || "Guest input here…"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CTA button ── */}
        {block.type === "cta" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Button label">
                <input
                  value={block.label}
                  onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                  className={inputCls}
                  placeholder="Open RSVP"
                />
              </Field>
              <Field label="Link / URL (optional)" hint="Leave blank or # for a decorative button">
                <input
                  value={block.href ?? ""}
                  onChange={(e) => onUpdate(block.id, { href: e.target.value })}
                  className={inputCls}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Alignment">
                <select
                  value={block.align}
                  onChange={(e) => onUpdate(block.id, { align: toAlign(e.target.value) })}
                  className={inputCls}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
            </div>

            {/* Button appearance */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Button appearance</p>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Button color"
                  value={block.ctaColor}
                  defaultValue={accentColor}
                  onChange={(v) => onUpdate(block.id, { ctaColor: v } as Partial<RsvpBlock>)}
                />
                <ColorField
                  label="Text color"
                  value={block.ctaTextColor}
                  defaultValue="#0f172a"
                  onChange={(v) => onUpdate(block.id, { ctaTextColor: v } as Partial<RsvpBlock>)}
                />
              </div>
              {/* Live preview */}
              <div className={`flex ${block.align === "center" ? "justify-center" : block.align === "right" ? "justify-end" : "justify-start"}`}>
                <div
                  className="inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold shadow"
                  style={{
                    background: block.ctaColor ?? accentColor,
                    color: block.ctaTextColor ?? "#0f172a",
                  }}
                >
                  {block.label || "Preview button"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Attendance ── */}
        {block.type === "attendance" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Title">
                <input
                  value={block.title ?? ""}
                  onChange={(e) => onUpdate(block.id, { title: e.target.value })}
                  className={inputCls}
                  placeholder="Will you be attending?"
                />
              </Field>
              <Field label="Subtitle (optional)">
                <input
                  value={block.subtitle ?? ""}
                  onChange={(e) => onUpdate(block.id, { subtitle: e.target.value })}
                  className={inputCls}
                  placeholder="Please let us know"
                />
              </Field>
              <Field label="Width">
                <select
                  value={block.width ?? "full"}
                  onChange={(e) => onUpdate(block.id, { width: toWidth(e.target.value) })}
                  className={inputCls}
                >
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Guest details ── */}
        {block.type === "guestDetails" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Title">
                <input
                  value={block.title ?? ""}
                  onChange={(e) => onUpdate(block.id, { title: e.target.value })}
                  className={inputCls}
                  placeholder="Your details"
                />
              </Field>
              <Field label="Subtitle (optional)">
                <input
                  value={block.subtitle ?? ""}
                  onChange={(e) => onUpdate(block.id, { subtitle: e.target.value })}
                  className={inputCls}
                  placeholder="Tell us about yourself"
                />
              </Field>
              <Field label="Width">
                <select
                  value={block.width ?? "full"}
                  onChange={(e) => onUpdate(block.id, { width: toWidth(e.target.value) })}
                  className={inputCls}
                >
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </select>
              </Field>
            </div>

            {/* Card appearance */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Card appearance</p>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Card background"
                  value={block.cardColor}
                  defaultValue="#ffffff"
                  onChange={(v) => onUpdate(block.id, { cardColor: v } as Partial<RsvpBlock>)}
                />
                <ColorField
                  label="Card text color"
                  value={block.cardTextColor}
                  defaultValue="#111827"
                  onChange={(v) => onUpdate(block.id, { cardTextColor: v } as Partial<RsvpBlock>)}
                />
              </div>
              {/* Live preview swatch */}
              <div
                className="rounded-lg px-3 py-2 text-xs font-medium shadow-sm"
                style={{
                  backgroundColor: block.cardColor ?? "#ffffff",
                  color: block.cardTextColor ?? "#111827",
                }}
              >
                Name · Phone number · Pax · Remarks — card preview
              </div>
            </div>

            {/* Visible fields */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visible fields</p>
              {([
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone number" },
                { key: "pax", label: "Number of guests" },
                { key: "remarks", label: "Remarks" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={block.showFields?.[key] !== false}
                    onChange={(e) =>
                      onUpdate(block.id, {
                        showFields: { ...block.showFields, [key]: e.target.checked },
                      } as Partial<RsvpBlock>)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm text-gray-600">{label}</span>
                </label>
              ))}
            </div>

            {/* Custom questions — embedded inside this block */}
            <GuestDetailsCustomQuestions
              block={block}
              formFields={formFields}
              onUpdate={onUpdate}
            />
          </div>
        )}

        {/* ── Image gallery ── */}
        {block.type === "image" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Caption (optional)">
                <input
                  value={block.caption ?? ""}
                  onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
                  className={inputCls}
                  placeholder="A blessed moment…"
                />
              </Field>
              <Field label="Block height">
                <select
                  value={block.height ?? "medium"}
                  onChange={(e) =>
                    onUpdate(block.id, {
                      height: e.target.value === "tall" ? "tall" : e.target.value === "short" ? "short" : "medium",
                    })
                  }
                  className={inputCls}
                >
                  <option value="short">Compact</option>
                  <option value="medium">Standard</option>
                  <option value="tall">Tall</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary transition">
                Replace first image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onReplaceImage(block.id, e.target.files[0])}
                />
              </label>
              <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary transition">
                Add more images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onAppendImages(block.id, e.target.files)}
                />
              </label>
            </div>
            {block.images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {block.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => onUpdate(block.id, { activeImageId: img.id })}
                    className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      block.activeImageId === img.id ? "border-primary shadow" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No images uploaded yet.</p>
            )}
          </div>
        )}

        {/* ── Map / Venue ── */}
        {block.type === "map" && (
          <div className="space-y-3">
            <Field
              label="Address or venue name"
              hint="Enter a full street address or a well-known landmark — e.g. Mandarin Oriental, Kuala Lumpur. The map updates automatically."
            >
              <input
                value={block.address ?? ""}
                onChange={(e) => onUpdate(block.id, { address: e.target.value } as Partial<RsvpBlock>)}
                className={inputCls}
                placeholder="e.g. Dewan Seri Murni, Kuala Lumpur"
              />
            </Field>
            <Field label="Venue label">
              <input
                value={block.mapLabel ?? ""}
                onChange={(e) => onUpdate(block.id, { mapLabel: e.target.value } as Partial<RsvpBlock>)}
                className={inputCls}
                placeholder="Venue"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={block.showDirections !== false}
                onChange={(e) => onUpdate(block.id, { showDirections: e.target.checked } as Partial<RsvpBlock>)}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <span className="text-sm text-gray-600">Show "Get Directions" link</span>
            </label>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION BACKGROUND (collapsible)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <SectionHeader
            icon="🌄"
            title="Section background"
            note={bgNote}
            open={bgOpen}
            onToggle={() => setBgOpen((o) => !o)}
          />
          {bgOpen && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
              <label className="block cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary transition">
                + Upload background images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onAddBackgroundImages(block.id, e.target.files)}
                />
              </label>
              {bgImages.length > 0 && (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {bgImages.map((img) => (
                      <div key={img.id} className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onSetActiveBackground(block.id, img.id)}
                          className={`h-14 w-20 overflow-hidden rounded-lg border-2 transition block ${
                            block.background?.activeImageId === img.id
                              ? "border-primary shadow-md"
                              : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveBackgroundImage(block.id, img.id)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] shadow hover:bg-rose-600"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Overlay strength</span>
                      <span>{Math.round(overlayStrength * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.9}
                      step={0.05}
                      value={overlayStrength}
                      onChange={(e) => onSetOverlay(block.id, parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SPOTLIGHT IMAGE (collapsible)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <SectionHeader
            icon="✨"
            title="Spotlight image"
            note={spotlightNote}
            open={spotlightOpen}
            onToggle={() => setSpotlightOpen((o) => !o)}
          />
          {spotlightOpen && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
              <p className="text-xs text-gray-400">A full backdrop just for this block — ideal for hero moments.</p>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary transition">
                  {block.sectionImage ? "Replace spotlight image" : "+ Set spotlight image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onSetSectionImage(block.id, e.target.files[0])}
                  />
                </label>
                {block.sectionImage && (
                  <button
                    type="button"
                    onClick={() => onClearSectionImage(block.id)}
                    className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    Remove
                  </button>
                )}
              </div>
              {block.sectionImage && (
                <div className="overflow-hidden rounded-lg border">
                  <img src={block.sectionImage.src} alt={block.sectionImage.alt ?? ""} className="h-28 w-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Custom-questions editor (embedded in guestDetails) ────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

function GuestDetailsCustomQuestions({
  block,
  formFields,
  onUpdate,
}: {
  block: Extract<RsvpBlock, { type: "guestDetails" }>;
  formFields: FormFieldConfig[];
  onUpdate: (id: string, patch: Partial<RsvpBlock>) => void;
}) {
  const questions = block.customQuestions ?? [];

  const updateQuestions = (next: NonNullable<typeof block.customQuestions>) => {
    onUpdate(block.id, { customQuestions: next } as Partial<RsvpBlock>);
  };

  const addBlank = () => {
    updateQuestions([
      ...questions,
      { id: uid(), label: "Custom question", placeholder: "Guest response...", required: false },
    ]);
  };

  const addFromBank = (formFieldId: string) => {
    if (!formFieldId) return;
    const field = formFields.find((f) => String(f.id ?? f.questionId) === formFieldId);
    if (!field) return;
    updateQuestions([
      ...questions,
      {
        id: uid(),
        questionId: formFieldId,
        label: field.label || field.text || "Custom field",
        placeholder: Array.isArray(field.options) ? String(field.options[0] ?? "") : "",
        required: field.isRequired ?? false,
        hint: field.typeKey ? `${field.typeKey}${field.isRequired ? " · required" : ""}` : undefined,
      },
    ]);
  };

  const patchQuestion = (qid: string, patch: Partial<NonNullable<typeof block.customQuestions>[number]>) => {
    updateQuestions(questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (qid: string) => {
    updateQuestions(questions.filter((q) => q.id !== qid));
  };

  const moveQuestion = (qid: string, dir: "up" | "down") => {
    const i = questions.findIndex((q) => q.id === qid);
    if (i === -1) return;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[i], next[j]] = [next[j], next[i]];
    updateQuestions(next);
  };

  // formFields not yet linked to any question on this block
  const linkedIds = new Set(questions.map((q) => q.questionId).filter(Boolean));
  const remainingFields = formFields.filter((f) => !linkedIds.has(String(f.id ?? f.questionId)));

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Custom questions
          {questions.length > 0 && <span className="ml-1.5 text-gray-400">({questions.length})</span>}
        </p>
        <button
          type="button"
          onClick={addBlank}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          + Add blank
        </button>
      </div>

      {remainingFields.length > 0 && (
        <div className="rounded-lg bg-white border border-gray-200 px-2.5 py-2 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 shrink-0">From RSVP form</span>
          <select
            value=""
            onChange={(e) => { addFromBank(e.target.value); e.target.value = ""; }}
            className="flex-1 text-xs bg-transparent outline-none text-gray-700"
          >
            <option value="">— pick a question —</option>
            {remainingFields.map((q) => (
              <option key={q.id ?? q.questionId} value={String(q.id ?? q.questionId)}>
                {q.label || q.text || q.name}{q.isRequired ? " *" : ""}
                {q.typeKey ? ` (${q.typeKey})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          No custom questions yet. Add a blank one or pull from your RSVP form bank.
        </p>
      ) : (
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-1.5 text-[10px] font-mono text-gray-400 w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    value={q.label ?? ""}
                    onChange={(e) => patchQuestion(q.id, { label: e.target.value })}
                    placeholder="Question label"
                    className="w-full text-sm font-medium bg-transparent outline-none border-b border-transparent focus:border-primary/40 transition pb-0.5"
                  />
                  <input
                    value={q.placeholder ?? ""}
                    onChange={(e) => patchQuestion(q.id, { placeholder: e.target.value })}
                    placeholder="Placeholder text"
                    className="w-full text-xs text-gray-600 bg-transparent outline-none border-b border-transparent focus:border-primary/40 transition pb-0.5"
                  />
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button type="button" onClick={() => moveQuestion(q.id, "up")} disabled={i === 0}
                    className="w-5 h-5 grid place-items-center text-[10px] text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveQuestion(q.id, "down")} disabled={i === questions.length - 1}
                    className="w-5 h-5 grid place-items-center text-[10px] text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                </div>
                <button type="button" onClick={() => removeQuestion(q.id)} title="Remove"
                  className="w-5 h-5 grid place-items-center text-[11px] text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded shrink-0">✕</button>
              </div>
              <div className="flex items-center justify-between gap-3 pl-7">
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!q.required}
                    onChange={(e) => patchQuestion(q.id, { required: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary"
                  />
                  Required
                </label>
                {q.questionId && (
                  <span className="text-[10px] text-emerald-600">✓ linked</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
