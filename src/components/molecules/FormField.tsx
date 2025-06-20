import React from "react";
import { Input } from "../atoms/Input";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  id,
  ...inputProps
}) => {
  const inputId = id ?? `field_${label.replace(/\s+/g, "_").toLowerCase()}`;

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-text">
        {label}
      </label>
      <Input id={inputId} {...inputProps} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
