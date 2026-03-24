// src/api/hooks/useFormFieldsApi.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { FormFieldsEndpoints } from "../endpoints";
import { TYPE_KEY_MAP } from "../../utils/eventUtils";

/** UI model for the modal / page */
export interface FormFieldConfig {
  questionId?: string;
  id?: string;
  eventGuid?: string;

  text?: string;
  isRequired?: boolean;
  type?: number;
  options?: string | string[];
  order?: number;

  label?: string;
  name?: string;
  typeKey?: "text" | "textarea" | "select" | "radio" | "checkbox" | "email" | "number" | "date";
  isActive?: boolean;
}

/** Payload we actually send to the Question API */
export type QuestionPayload = FormFieldConfig;

/** Payload for Activate / Deactivate endpoints */
type QuestionTogglePayload = {
  eventId: string;   // pass the event GUID here
  isActive: boolean;
  questionId: string;
};

export function useFormFields(eventId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["formFields", eventId],
    enabled: !!eventId && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!eventId) return [] as FormFieldConfig[];

      const res = await client.get(FormFieldsEndpoints.all(eventId));
      const raw = res.data?.data ?? [];

      return (Array.isArray(raw) ? raw : []).map((r: any) => ({
        questionId: String(r.questionId ?? r.id ?? ""),
        id: String(r.questionId ?? r.id ?? ""),
        eventGuid: r.eventGuid,
        label: r.label ?? r.text ?? r.name ?? "",
        name: r.name ?? (r.label ?? r.text ?? "").toLowerCase().replace(/\s+/g, "_"),
        text: r.text ?? r.label ?? "",
        isRequired: r.isRequired ?? r.required ?? false,
        isActive: r.isActive ?? true,
        type: typeof r.type === "number" ? r.type : undefined,
        typeKey: typeof r.type === "number" ? TYPE_KEY_MAP[r.type] : (r.typeKey ?? r.type),
        options: Array.isArray(r.options)
          ? r.options
          : typeof r.options === "string"
          ? r.options.split(",").map((s: string) => s.trim()).filter(Boolean)
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
    mutationFn: (payload: QuestionPayload) =>
      client.post(FormFieldsEndpoints.create(), payload).then((r) => r.data),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["formFields", eventId ?? (vars as any)?.eventGuid] }),
  });
}

/** UPDATE question */
export function useUpdateFormField(eventId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuestionPayload & { questionId?: string }) => {
      const body: any = { ...payload };
      delete body.id;
      return client.post(FormFieldsEndpoints.update(), body).then((r) => r.data);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["formFields", eventId ?? (vars as any)?.eventGuid] }),
  });
}

/** DEACTIVATE question — { isActive: false, questionId, eventId } */
export function useDeactivateFormField(eventGuid?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuestionTogglePayload) =>
      client.post(FormFieldsEndpoints.deactivate(), payload).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["formFields", eventGuid] }),
  });
}

/** ACTIVATE question — { isActive: true, questionId, eventId } */
export function useActivateFormField(eventGuid?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuestionTogglePayload) =>
      client.post(FormFieldsEndpoints.activate(), payload).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["formFields", eventGuid] }),
  });
}

/** DELETE question (hard delete) — { eventId, isActive, questionId } */
export function useDeleteFormField(eventGuid?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuestionTogglePayload) =>
      client.post(FormFieldsEndpoints.delete(), payload).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["formFields", eventGuid] }),
  });
}
