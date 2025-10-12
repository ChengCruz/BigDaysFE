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
  onSave: (payload: QuestionDto) => void;
}

/** String ⇄ number map for the API “type” enum */
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

const REQUIRES_OPTIONS: TypeKey[] = ["select", "radio", "checkbox"];

export function FormFieldModal({
  isOpen,
  onClose,
  initial,
  onSave,
}: Props) {
  // derive string key for the select from the numeric initial?.type
  const initialTypeKey = useMemo<TypeKey>(() => {
    const pair = Object.entries(TYPE_MAP).find(
      ([, val]) => val === (initial?.type ?? TYPE_MAP.text)
    );
    return (pair?.[0] as TypeKey) ?? "text";
  }, [initial?.type]);

  const [text, setText] = useState(initial?.text ?? "");
  const [required, setRequired] = useState<boolean>(initial?.isRequired ?? false);
  const [typeKey, setTypeKey] = useState<TypeKey>(initialTypeKey);
  const [options, setOptions] = useState<string>(initial?.options ?? "");
  const [order, setOrder] = useState<number>(Number.isFinite(initial?.order) ? (initial!.order as number) : 0);

  useEffect(() => {
    if (!isOpen) return;
    setText(initial?.text ?? "");
    setRequired(initial?.isRequired ?? false);
    setOrder(Number.isFinite(initial?.order) ? (initial!.order as number) : 0);

    // type
    const pair = Object.entries(TYPE_MAP).find(([ , v]) => v === (initial?.type ?? TYPE_MAP.text));
    setTypeKey(((pair?.[0] as TypeKey) ?? "text"));
    setOptions(initial?.options ?? "");
  }, [isOpen, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    onSave(dto);
  };

  const needsOptions = REQUIRES_OPTIONS.includes(typeKey);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Edit Field" : "New Field"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Question Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Do you have any dietary requirements?"
        />

        <div>
          <label className="block mb-1">Type</label>
          <select
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value as TypeKey)}
            className="w-full border rounded p-2"
          >
            {Object.keys(TYPE_MAP).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            This maps to API numeric codes (e.g. text=0, textarea=1, select=2, …).
          </p>
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
          placeholder="0"
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initial ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
