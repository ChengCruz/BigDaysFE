// src/api/hooks/useFormFieldsApi.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { FormFieldsEndpoints } from "../endpoints";

/** UI model for the modal / page */
export interface FormFieldConfig {
  // identifiers (API may use questionId or id)
  questionId?: string;
  id?: string;
  eventGuid?: string;

  // API DTO fields
  text?: string; // question text
  isRequired?: boolean;
  // numeric enum type used by API (0..7)
  type?: number;
  options?: string | string[];
  order?: number;

  // UI-friendly fields (optional)
  label?: string;
  name?: string;
  // string type used in some UI components
  typeKey?: "text" | "textarea" | "select" | "radio" | "checkbox" | "email" | "number" | "date";
}

/** Payload we actually send to the Question API (needs eventId too) */
export type QuestionPayload = FormFieldConfig;

/** Optional: fetcher (kept as-is) */
export function useFormFields(eventId: string) {
  return useQuery({
    queryKey: ["formFields", eventId],
    queryFn: async () => {
      const res = await client.get(FormFieldsEndpoints.all(eventId));
      const raw = res.data?.data ?? [];

      // Map numeric API DTOs to a consistent UI shape
      const TYPE_KEY_MAP: Record<number, FormFieldConfig["typeKey"]> = {
        0: "text",
        1: "textarea",
        2: "select",
        3: "radio",
        4: "checkbox",
        5: "email",
        6: "number",
        7: "date",
      };

      return (Array.isArray(raw) ? raw : []).map((r: any) => ({
        questionId: r.id ?? r.questionId,
        id: r.id ?? r.questionId,
        eventId: r.eventId,
        label: r.label ?? r.text ?? r.name ?? "",
        name: r.name ?? (r.label ?? r.text ?? "").toLowerCase().replace(/\s+/g, "_"),
        text: r.text ?? r.label ?? "",
        isRequired: r.isRequired ?? r.required ?? false,
        type: typeof r.type === "number" ? r.type : undefined,
        typeKey: typeof r.type === "number" ? TYPE_KEY_MAP[r.type] : (r.typeKey ?? r.type),
        options: Array.isArray(r.options)
          ? r.options
          : typeof r.options === "string"
          ? r.options
          : undefined,
        order: r.order ?? 0,
      } as FormFieldConfig));
    },
  });
}

/** CREATE question */
export function useCreateFormField(eventId?: string) {
  const qc = useQueryClient();
  return useMutation({
    // allow optional eventId closure so callers can pass id when they want
    mutationFn: (payload: QuestionPayload) =>
      client.post(FormFieldsEndpoints.create(), payload).then((r) => r.data),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["formFields", eventId ?? (vars as any)?.eventId] }),
  });
}

/** UPDATE question */
export function useUpdateFormField(eventId?: string) {
  const qc = useQueryClient();
  return useMutation({
    // require id (or questionId) and allow eventId in the body
    // The backend expects POST for question updates (not PUT)
    mutationFn: (payload: QuestionPayload & { id?: string; questionId?: string }) => {
      // Normalize to the API expected field name `questionId`
      const body: any = { ...payload, questionId: payload.questionId ?? payload.id };
      // Ensure we don't send `id` as well since API expects `questionId`
      delete body.id;
      return client.post(FormFieldsEndpoints.update(), body).then((r) => r.data);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["formFields", eventId ?? (vars as any)?.eventId] }),
  });
}

/** DELETE question */
export function useDeleteFormField(eventId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      client.delete(FormFieldsEndpoints.deactivate()).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formFields", eventId] }),
  });
}
