// src/components/molecules/FormField.tsx

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "password"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"; // single boolean checkbox

export interface FormFieldProps {
  label: string;

  /** Input kind (defaults to "text") */
  type?: FieldType;

  /** Only for select / radio / checkbox groups */
  options?: string[];

  /** Controlled value (for checkbox this is "true" | "false") */
  value: string;

  /** Standard controlled onChange handler */
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;

  required?: boolean;
  className?: string;

  // ---- extra quality-of-life props (used across app) ----
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;

  /** Number inputs only */
  min?: number;
  max?: number;
  step?: number;

  /** Textarea only */
  rows?: number;

  /** Optional helper or error text */
  hint?: string;
  error?: string;

  /** Label for the empty option in a <select> (default: "— select —") */
  emptyOptionLabel?: string;
}

export function FormField({
  label,
  type = "text",
  options,
  value,
  onChange,
  required = false,
  className = "",
  name,
  id,
  placeholder,
  disabled,
  autoFocus,
  min,
  max,
  step,
  rows = 3,
  hint,
  error,
  emptyOptionLabel = "— select —",
}: FormFieldProps) {
  const base =
    "w-full border rounded p-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const borderColor = error ? "border-red-500" : "border-gray-300";
  const helperColor = error ? "text-red-600" : "text-gray-500";

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block font-medium">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          className={`${base} ${borderColor}`}
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
        />
      ) : type === "select" ? (
        <select
          id={id}
          name={name}
          className={`${base} ${borderColor}`}
          value={value}
          onChange={onChange as any}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
        >
          <option value="">{emptyOptionLabel}</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "radio" ? (
        <div className="flex flex-wrap gap-3">
          {options?.map((opt) => (
            <label key={opt} className="inline-flex items-center space-x-2">
              <input
                type="radio"
                id={id ? `${id}-${opt}` : undefined}
                name={name}
                value={opt}
                checked={value === opt}
                onChange={onChange as any}
                disabled={disabled}
                required={required}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : type === "checkbox" ? (
        // single boolean checkbox; value is "true" | "false"
        <label className="inline-flex items-center space-x-2">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => {
              // synthesize a change event with "true"/"false" value
              const synthetic = {
                ...e,
                target: {
                  ...(e.target as any),
                  value: e.target.checked ? "true" : "false",
                },
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(synthetic);
            }}
            disabled={disabled}
            required={required}
          />
          <span>{label}</span>
        </label>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          className={`${base} ${borderColor}`}
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          min={min}
          max={max}
          step={step}
        />
      )}

      {(hint || error) && (
        <p className={`text-xs ${helperColor}`}>{error ?? hint}</p>
      )}
    </div>
  );
}
