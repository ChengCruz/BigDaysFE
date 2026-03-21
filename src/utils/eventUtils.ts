import type { FormFieldConfig } from "../api/hooks/useFormFieldsApi";

export const TYPE_KEY_MAP: Record<number, FormFieldConfig["typeKey"]> = {
  0: "text", 1: "textarea", 2: "select", 3: "radio",
  4: "checkbox", 5: "email", 6: "number", 7: "date",
};
