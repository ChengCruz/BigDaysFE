// src/api/hooks/useFormFieldsApi.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { FormFieldsEndpoints } from "../endpoints";

/** UI model for the modal / page */
export interface FormFieldConfig {
  questionId?: string;
  eventId?: string;
  text: string;
  type: number; // e.g., text, select, radio, checkbox
  required: boolean;
  options?: string; // for select/radio/checkbox
}

/** Payload we actually send to the Question API (needs eventId too) */
export type QuestionPayload = FormFieldConfig;

/** Optional: fetcher (kept as-is) */
export function useFormFields(eventId: string) {
  return useQuery({
    queryKey: ["formFields", eventId],
    queryFn: async () => {
      const res = await client.get(FormFieldsEndpoints.all(eventId));
      return res.data?.data ?? [];
    },
  });
}

/** CREATE question */
export function useCreateFormField() {
  const qc = useQueryClient();
  return useMutation({
    // ✅ allow eventId in the body
    mutationFn: (payload: QuestionPayload) =>
      client.post(FormFieldsEndpoints.create(), payload).then((r) => r.data),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["formFields", vars.eventId] }),
  });
}

/** UPDATE question */
export function useUpdateFormField() {
  const qc = useQueryClient();
  return useMutation({
    // ✅ require id and allow eventId in the body
    mutationFn: (payload: QuestionPayload & { id: string }) =>
      client.put(FormFieldsEndpoints.update(), payload).then((r) => r.data),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["formFields", vars.eventId] }),
  });
}

/** DELETE question */
export function useDeleteFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      client.delete(FormFieldsEndpoints.deactivate()).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formFields"] }),
  });
}
