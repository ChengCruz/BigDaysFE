import React, { useState, useEffect } from "react";
import { type FormFieldConfig } from "../../api/hooks/useFormFieldsApi";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button } from "../atoms/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: FormFieldConfig;
  onSave: (cfg: Omit<FormFieldConfig, "id"> & { id?: string }) => void;
}

export function FormFieldModal({ isOpen, onClose, initial, onSave }: Props) {
  const [name, setName]     = useState(initial?.name    || "");
  const [label, setLabel]   = useState(initial?.label   || "");
  const [type, setType]     = useState<FormFieldConfig["type"]>(
    initial?.type || "text"
  );
  const [required, setReq]  = useState(initial?.required || false);

  // normalize incoming options to a comma string
  const normalize = (opts?: string[] | string | null) => {
    if (Array.isArray(opts)) return opts.join(",");
    if (typeof opts === "string") {
      try {
        const parsed = JSON.parse(opts);
        if (Array.isArray(parsed)) return parsed.join(",");
      } catch {}
      return opts;
    }
    return "";
  };
  const [options, setOpts] = useState(() => normalize(initial?.options as any));

  useEffect(() => {
    if (!isOpen) return;
    setName(initial?.name    || "");
    setLabel(initial?.label  || "");
    setType(initial?.type    || "text");
    setReq(initial?.required || false);
    setOpts(normalize(initial?.options as any));
  }, [isOpen, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg: Omit<FormFieldConfig, "id"> = {
      name,
      label,
      type,
      required,
      options: options
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    };
    onSave(initial ? { ...initial, ...cfg } : cfg);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Edit Field" : "New Field"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Key (name)" value={name} onChange={e => setName(e.target.value)} />
        <FormField label="Label"     value={label} onChange={e => setLabel(e.target.value)} />

        <div>
          <label className="block mb-1">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="w-full border rounded p-2"
          >
            {["text","textarea","select","radio","checkbox","email","number","date"].map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="required"
            type="checkbox"
            checked={required}
            onChange={e => setReq(e.target.checked)}
          />
          <label htmlFor="required">Required</label>
        </div>

        {(type === "select" || type === "radio" || type === "checkbox") && (
          <FormField
            label="Options (comma-separated)"
            value={options}
            onChange={e => setOpts(e.target.value)}
          />
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initial ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
