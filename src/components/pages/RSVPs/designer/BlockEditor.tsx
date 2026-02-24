// designer/BlockEditor.tsx
// Right panel: editor for the currently selected RSVP design block.
import React from "react";
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
  onSetSectionImage: (blockId: string, file: File) => void;
  onClearSectionImage: (blockId: string) => void;
  onReplaceImage: (blockId: string, file: File) => void;
  onAppendImages: (blockId: string, files: FileList) => void;
  onApplyQuestion: (blockId: string, questionId: string | undefined) => void;
}

const toAlign = (v: string): "left" | "center" | "right" =>
  v === "center" || v === "right" ? v : "left";

const toWidth = (v: string): "full" | "half" => (v === "half" ? "half" : "full");

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</p>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-500">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none";

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

export function BlockEditor({
  block,
  accentColor,
  formFields,
  onUpdate,
  onRemove,
  onAddBackgroundImages,
  onSetActiveBackground,
  onSetOverlay,
  onSetSectionImage,
  onClearSectionImage,
  onReplaceImage,
  onAppendImages,
  onApplyQuestion,
}: Props) {
  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-gray-300 text-xl">
          ←
        </div>
        <p className="text-base font-semibold text-gray-700">Select a block to edit</p>
        <p className="mt-1 text-sm">Choose a block from the list on the left to edit its content, backgrounds, and settings.</p>
      </div>
    );
  }

  const bgImages = block.background?.images ?? [];
  const overlayStrength = block.background?.overlay ?? 0.4;

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Editing block</p>
          <h3 className="text-base font-bold text-gray-800">{BLOCK_TYPE_LABEL[block.type] ?? block.type}</h3>
        </div>
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
        >
          Remove block
        </button>
      </div>

      {/* ── Block background gallery ── */}
      <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Block background gallery</SectionTitle>
          <span className="text-xs text-gray-400">{bgImages.length} image(s)</span>
        </div>
        <label className="block cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary">
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
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onSetActiveBackground(block.id, img.id)}
                  className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    block.background?.activeImageId === img.id
                      ? "border-primary shadow-md"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                </button>
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

      {/* ── Section spotlight image ── */}
      <div className="space-y-2 rounded-lg border border-gray-100 bg-white p-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Section spotlight image</SectionTitle>
          {block.sectionImage && (
            <button
              type="button"
              onClick={() => onClearSectionImage(block.id)}
              className="text-xs font-semibold text-rose-600"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">A dedicated backdrop just for this block — ideal for hero moments.</p>
        <label className="block cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary">
          {block.sectionImage ? "Replace spotlight image" : "+ Set spotlight image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onSetSectionImage(block.id, e.target.files[0])}
          />
        </label>
        {block.sectionImage && (
          <div className="overflow-hidden rounded-lg border">
            <img src={block.sectionImage.src} alt={block.sectionImage.alt ?? ""} className="h-32 w-full object-cover" />
          </div>
        )}
      </div>

      {/* ── Type-specific content editors ── */}
      {block.type === "headline" && (
        <div className="space-y-3">
          <SectionTitle>Headline content</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Title">
              <input
                value={block.title}
                onChange={(e) => onUpdate(block.id, { title: e.target.value })}
                className={inputCls}
                placeholder="Welcome to our wedding"
              />
            </Field>
            <Field label="Subtitle (optional)">
              <input
                value={block.subtitle ?? ""}
                onChange={(e) => onUpdate(block.id, { subtitle: e.target.value })}
                className={inputCls}
                placeholder="Save the date…"
              />
            </Field>
            <Field label="Text alignment">
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
            <Field label="Accent CSS classes">
              <input
                value={block.accent}
                onChange={(e) => onUpdate(block.id, { accent: e.target.value })}
                className={inputCls}
                placeholder="text-white"
              />
            </Field>
          </div>
        </div>
      )}

      {block.type === "text" && (
        <div className="space-y-3">
          <SectionTitle>Paragraph content</SectionTitle>
          <Field label="Body text">
            <textarea
              value={block.body}
              onChange={(e) => onUpdate(block.id, { body: e.target.value })}
              className={inputCls}
              rows={4}
              placeholder="Tell your story…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
        </div>
      )}

      {block.type === "info" && (
        <div className="space-y-3">
          <SectionTitle>Info badge content</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <Field label="Accent CSS classes">
            <input
              value={block.accent}
              onChange={(e) => onUpdate(block.id, { accent: e.target.value })}
              className={inputCls}
              placeholder="bg-white/20 text-white border border-white/30"
            />
          </Field>
        </div>
      )}

      {block.type === "formField" && (
        <div className="space-y-3">
          <SectionTitle>Form field settings</SectionTitle>
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
            {block.questionId && (
              <p className="mt-1 text-xs text-emerald-600">
                ✓ Linked — input type comes from the question definition.
              </p>
            )}
            {!block.questionId && (
              <p className="mt-1 text-xs text-amber-600">
                Select a question to enable this field for guests.
              </p>
            )}
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <Field label="Hint text (shown under field)">
            <input
              value={block.hint ?? ""}
              onChange={(e) => onUpdate(block.id, { hint: e.target.value })}
              className={inputCls}
              placeholder="e.g. Dietary restrictions or special requests"
            />
          </Field>
        </div>
      )}

      {block.type === "cta" && (
        <div className="space-y-3">
          <SectionTitle>CTA button</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Button label">
              <input
                value={block.label}
                onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                className={inputCls}
                placeholder="Open RSVP"
              />
            </Field>
            <Field label="Link / URL (optional)">
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
          <div
            className="mt-2 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow"
            style={{ background: accentColor, color: "#0f172a" }}
          >
            {block.label || "Preview button"}
          </div>
        </div>
      )}

      {block.type === "attendance" && (
        <div className="space-y-3">
          <SectionTitle>Attendance settings</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {block.type === "guestDetails" && (
        <div className="space-y-3">
          <SectionTitle>Guest details settings</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <SectionTitle>Visible fields</SectionTitle>
          <div className="space-y-2">
            {([
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone number" },
              { key: "pax", label: "Number of guests" },
              { key: "guestType", label: "Guest type (Family/Friend/VIP)" },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
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
        </div>
      )}

      {block.type === "image" && (
        <div className="space-y-3">
          <SectionTitle>Image gallery</SectionTitle>
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
          <div className="grid grid-cols-2 gap-2">
            <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary">
              Replace first image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onReplaceImage(block.id, e.target.files[0])}
              />
            </label>
            <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-primary hover:border-primary">
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
          {block.images.length > 0 && (
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
          )}
          {block.images.length === 0 && (
            <p className="text-xs text-gray-400">No images uploaded yet. Use the buttons above to add photos.</p>
          )}
        </div>
      )}
    </div>
  );
}
