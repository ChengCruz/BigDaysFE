// designer/AddBlockMenu.tsx
// Bottom panel of the left sidebar: block type buttons + RSVP question inserter.
import { useState } from "react";
import { Button } from "../../../atoms/Button";
import type { RsvpBlock } from "../../../../types/rsvpDesign";
import type { FormFieldConfig } from "../../../../api/hooks/useFormFieldsApi";

const BLOCK_TYPES: { type: RsvpBlock["type"]; label: string; desc: string; icon: string }[] = [
  { type: "headline",     label: "Headline",     desc: "Big title + subtitle",              icon: "H" },
  { type: "text",         label: "Paragraph",    desc: "Body text section",                 icon: "T" },
  { type: "info",         label: "Info badge",   desc: "Label + content pill",              icon: "i" },
  { type: "attendance",   label: "Attendance",   desc: "Yes/No/Maybe attendance toggle",    icon: "R" },
  { type: "guestDetails", label: "Guest info",   desc: "Name, email, phone, pax fields",   icon: "U" },
  { type: "formField",    label: "Form field",   desc: "Custom question from Form Fields",  icon: "?" },
  { type: "cta",          label: "CTA button",   desc: "Styled call-to-action button",      icon: "→" },
  { type: "image",        label: "Image",        desc: "Photo or gallery block",            icon: "🖼" },
];

interface Props {
  onAdd: (type: RsvpBlock["type"]) => void;
  onUploadImages: (files: FileList) => void;
  availableQuestions: FormFieldConfig[];
  isFetchingQuestions: boolean;
  onInsertQuestion: (questionId: string) => void;
}

export function AddBlockMenu({
  onAdd,
  onUploadImages,
  availableQuestions,
  isFetchingQuestions,
  onInsertQuestion,
}: Props) {
  const [questionToInsert, setQuestionToInsert] = useState("");

  const handleInsert = () => {
    if (!questionToInsert) return;
    onInsertQuestion(questionToInsert);
    setQuestionToInsert("");
  };

  const questionSummary = isFetchingQuestions
    ? "Loading questions..."
    : availableQuestions.length === 0
    ? "No RSVP questions for this event yet."
    : `${availableQuestions.length} question(s) available`;

  return (
    <div className="space-y-4">
      {/* Block type grid */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Add block</p>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TYPES.filter((b) => b.type !== "image").map(({ type, label, desc, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              title={desc}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <span className="flex-shrink-0 text-base">{icon}</span>
              {label}
            </button>
          ))}
          <label
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
            title="Upload images and create an image block"
          >
            <span className="flex-shrink-0 text-base">🖼</span>
            Upload image
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && onUploadImages(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Question inserter */}
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Insert RSVP question
        </p>
        <div className="flex gap-2">
          <select
            value={questionToInsert}
            onChange={(e) => setQuestionToInsert(e.target.value)}
            className="flex-1 rounded-lg border px-2 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Select a question…</option>
            {availableQuestions.map((q) => (
              <option key={q.id ?? q.questionId} value={q.id ?? q.questionId}>
                {q.label || q.text || q.name}
              </option>
            ))}
          </select>
          <Button disabled={!questionToInsert} onClick={handleInsert} className="flex-shrink-0">
            Add
          </Button>
        </div>
        <p className="text-xs text-gray-500">{questionSummary}</p>
      </div>
    </div>
  );
}
