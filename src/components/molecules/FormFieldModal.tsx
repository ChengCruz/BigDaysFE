// src/components/molecules/FormFieldModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";

/**
 * The Question (custom field) payload the POST /Question/Create endpoint expects.
 * eventId is supplied by the page/hook; the modal collects the rest.
 */
export type QuestionDto = {
  id?: string;            // present when editing
  text: string;           // question text / label shown to guests
  isRequired: boolean;    // required?
  type: number;           // numeric type enum (see TYPE_MAP)
  options?: string;       // comma-separated options for select/radio/checkbox
  order: number;          // display order (0-based or 1-based depending on API)
  isDeleted?: boolean;    // rarely set from the UI; default false
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** existing Question dto when editing */
  initial?: QuestionDto;
  /** caller (page/hook) will attach eventId and send to the API */
  onSave: (payload: QuestionDto) => void | Promise<void>;
  /**
   * Message from the last failed save attempt (e.g. the backend refuses edits to a
   * question guests already answered). Shown at the top of the form so the refusal
   * is visible right where the user just clicked Save, instead of on a page banner
   * behind a modal that already closed.
   */
  error?: string | null;
}

/** String ⇄ number map for the API "type" enum */
const TYPE_MAP = {
  text: 0,
  textarea: 1,
  select: 2,
  radio: 3,
  checkbox: 4,
  email: 5,
  number: 6,
  date: 7,
} as const;
type TypeKey = keyof typeof TYPE_MAP;

export const TYPE_LABELS: Record<TypeKey, string> = {
  text: "Short Text",
  textarea: "Long Text",
  select: "Dropdown",
  radio: "Radio Buttons",
  checkbox: "Checkbox",
  email: "Email",
  number: "Number",
  date: "Date",
};

const REQUIRES_OPTIONS: TypeKey[] = ["select", "radio", "checkbox"];

export function FormFieldModal({
  isOpen,
  onClose,
  initial,
  onSave,
  error,
}: Props) {
  // derive string key for the select from the numeric initial?.type
  const initialTypeKey = useMemo<TypeKey>(() => {
    const pair = Object.entries(TYPE_MAP).find(
      ([, val]) => val === (initial?.type ?? TYPE_MAP.text)
    );
    return (pair?.[0] as TypeKey) ?? "text";
  }, [initial?.type]);

  const [text, setText] = useState(initial?.text ?? "");
  const [textError, setTextError] = useState("");
  const [required, setRequired] = useState<boolean>(initial?.isRequired ?? false);
  const [typeKey, setTypeKey] = useState<TypeKey>(initialTypeKey);
  const [options, setOptions] = useState<string>(initial?.options ?? "");
  const [order, setOrder] = useState<number>(Number.isFinite(initial?.order) ? (initial!.order as number) : 1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setText(initial?.text ?? "");
    setTextError("");
    setRequired(initial?.isRequired ?? false);
    setOrder(Number.isFinite(initial?.order) ? (initial!.order as number) : 1);

    // type
    const pair = Object.entries(TYPE_MAP).find(([ , v]) => v === (initial?.type ?? TYPE_MAP.text));
    setTypeKey(((pair?.[0] as TypeKey) ?? "text"));
    setOptions(initial?.options ?? "");
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setTextError("Question text is required");
      return;
    }
    const dto: QuestionDto = {
      id: initial?.id,
      text,
      isRequired: required,
      type: TYPE_MAP[typeKey],
      options: REQUIRES_OPTIONS.includes(typeKey)
        ? (options || "").trim()
        : undefined,
      order: Number.isFinite(order) ? order : 0,
      isDeleted: initial?.isDeleted ?? false,
    };
    setSaving(true);
    try {
      await onSave(dto);
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = REQUIRES_OPTIONS.includes(typeKey);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Edit Question" : "New Question"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200"
          >
            {error}
          </div>
        )}

        <FormField
          label="Question Text"
          value={text}
          onChange={(e) => { setText(e.target.value); setTextError(""); }}
          placeholder="e.g. Do you have any dietary requirements?"
          error={textError}
        />

        <div>
          <label className="block mb-1">Type</label>
          <select
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value as TypeKey)}
            className="w-full border rounded p-2"
          >
            {(Object.keys(TYPE_MAP) as TypeKey[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="required"
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          <label htmlFor="required">Required</label>
        </div>

        {needsOptions && (
          <FormField
            label="Options (comma-separated)"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="e.g. Beef, Chicken, Fish, Vegetarian"
          />
        )}

        <FormField
          label="Order"
          type="number"
          value={String(order)}
          onChange={(e) => setOrder(Number(e.target.value))}
          placeholder="1"
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : initial ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
