// src/components/molecules/FieldBuilderModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { Button }    from "../atoms/Button";
import type { FormFieldConfig } from "../../api/hooks/useFormFieldsApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: FormFieldConfig;
  onSave: (cfg: FormFieldConfig) => void;
}

export const FieldBuilderModal: React.FC<Props> = ({
  isOpen, onClose, initial, onSave
}) => {
  const [label, setLabel] = useState(initial?.label || "");
  const [name, setName]   = useState(initial?.name  || "");
  const [type, setType]   = useState<FormFieldConfig["type"]>(initial?.type || "text");
  const [required, setRequired] = useState(initial?.required||false);
  const [opts, setOpts]   = useState((initial?.options||[]).join(","));

  useEffect(() => {
    if (isOpen) {
      setLabel(initial?.label||"");
      setName(initial?.name||"");
      setType(initial?.type||"text");
      setRequired(initial?.required||false);
      setOpts((initial?.options||[]).join(","));
    }
  }, [isOpen, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg: FormFieldConfig = {
      ...initial!,
      label, name, type, required,
      options: ["select","radio","checkbox"].includes(type)
        ? opts.split(",").map(o=>o.trim()).filter(Boolean)
        : undefined
    };
    onSave(cfg);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? "Edit Field" : "New Field"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Label" value={label} onChange={e=>setLabel(e.target.value)}/>
        <FormField label="Name"  value={name}  onChange={e=>setName(e.target.value)}/>
        <div>
          <label className="block mb-1">Type</label>
          <select
            value={type}
            onChange={e=>setType(e.target.value as any)}
            className="w-full border rounded p-2"
          >
            {["text","textarea","select","radio","checkbox","email","number","date"].map(t=>(
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox" checked={required}
            onChange={e=>setRequired(e.target.checked)}
            id="req"
          />
          <label htmlFor="req">Required</label>
        </div>
        {(type==="select"||type==="radio"||type==="checkbox") && (
          <FormField
            label="Options (comma-sep)"
            value={opts}
            onChange={e=>setOpts(e.target.value)}
          />
        )}
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit">
            {initial ? "Save Field" : "Add Field"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
