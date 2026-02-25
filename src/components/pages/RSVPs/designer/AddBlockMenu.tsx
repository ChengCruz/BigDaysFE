// designer/AddBlockMenu.tsx
// Bottom panel of the left sidebar: block type buttons + RSVP question inserter.
import { useState } from "react";
import { Button } from "../../../atoms/Button";
import type { RsvpBlock } from "../../../../types/rsvpDesign";
import type { FormFieldConfig } from "../../../../api/hooks/useFormFieldsApi";

const BLOCK_TYPES: { type: RsvpBlock["type"]; label: string; desc: string; icon: string }[] = [
  { type: "headline",     label: "Headline",      desc: "Big title + subtitle",              icon: "H"  },
  { type: "text",         label: "Paragraph",     desc: "Body text section",                 icon: "T"  },
  { type: "info",         label: "Info badge",    desc: "Label + content pill",              icon: "i"  },
  { type: "attendance",   label: "Attendance",    desc: "Yes / No / Maybe toggle",           icon: "✓"  },
  { type: "guestDetails", label: "Guest info",    desc: "Name, phone, pax fields",           icon: "👤" },
  { type: "formField",    label: "Form field",    desc: "Custom RSVP question",              icon: "✎"  },
  { type: "cta",          label: "CTA button",    desc: "Styled call-to-action button",      icon: "→"  },
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
    ? "Loading questions…"
    : availableQuestions.length === 0
    ? "No RSVP questions for this event yet."
    : `${availableQuestions.length} question${availableQuestions.length !== 1 ? "s" : ""} available`;

  return (
    <div className="space-y-4">
      {/* Block type grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Add a block</p>
        <div className="grid grid-cols-2 gap-1.5">
          {BLOCK_TYPES.map(({ type, label, desc, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              className="flex flex-col gap-0.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{icon}</span>
                <span className="text-xs font-semibold text-gray-700">{label}</span>
              </div>
              <p className="text-[10px] leading-tight text-gray-400">{desc}</p>
            </button>
          ))}

          {/* Image upload as a block-add button */}
          <label className="flex flex-col gap-0.5 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition hover:border-primary hover:bg-primary/5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">🖼</span>
              <span className="text-xs font-semibold text-gray-700">Upload image</span>
            </div>
            <p className="text-[10px] leading-tight text-gray-400">Photo or gallery block</p>
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Insert RSVP question</p>
          <p className="mt-0.5 text-[10px] text-gray-400">{questionSummary}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={questionToInsert}
            onChange={(e) => setQuestionToInsert(e.target.value)}
            disabled={availableQuestions.length === 0 || isFetchingQuestions}
            className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
          >
            <option value="">Select a question…</option>
            {availableQuestions.map((q) => (
              <option key={q.id ?? q.questionId} value={q.id ?? q.questionId}>
                {q.label || q.text || q.name}
                {q.isRequired ? " *" : ""}
              </option>
            ))}
          </select>
          <Button disabled={!questionToInsert} onClick={handleInsert} className="flex-shrink-0">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
