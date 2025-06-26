// src/components/molecules/FormField.tsx

export type FieldType =
  | "text" | "email" | "number" | "date" | "password"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox";

export interface FormFieldProps {
  label: string;
  /** default to "text" */
  type?: FieldType;
  /** only for select / radio / checkbox */
  options?: string[];
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  required?: boolean;
  className?: string;
  // anything else you want to forward...
}

export function FormField({
  label,
  type = "text",
  options,
  value,
  onChange,
  required = false,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block font-medium">{label}</label>

      {type === "textarea" ? (
        <textarea
          className="w-full border rounded p-2"
          value={value}
          onChange={onChange as any}
          required={required}
        />
      ) : type === "select" ? (
        <select
          className="w-full border rounded p-2"
          value={value}
          onChange={onChange as any}
          required={required}
        >
          <option value="">— select —</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "radio" ? (
        <div className="flex flex-wrap gap-2">
          {options?.map((opt) => (
            <label key={opt} className="inline-flex items-center space-x-1">
              <input
                type="radio"
                value={opt}
                checked={value === opt}
                onChange={onChange as any}
                required={required}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : type === "checkbox" ? (
        <label className="inline-flex items-center space-x-1">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange({ ...e, target: { value: e.target.checked.toString() } } as any)}
          />
          <span>{label}</span>
        </label>
      ) : (
        <input
          type={type}
          className="w-full border rounded p-2"
          value={value}
          onChange={onChange as any}
          required={required}
        />
      )}
    </div>
  );
}
