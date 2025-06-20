// src/api/hooks/useFormFieldsApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { FormFieldsEndpoints } from "../endpoints";

export interface FormFieldConfig {
  id?: string;
  name: string;
  label: string;
  type: "text"|"textarea"|"select"|"radio"|"checkbox"|"email"|"number"|"date";
  required: boolean;
  options?: string[]; // for select/radio/checkbox
}

export function useFormFields(eventId: string) {
  return useQuery({
    queryKey: ["formFields", eventId],
    queryFn: async () => (await client.get(FormFieldsEndpoints.all(eventId))).data as FormFieldConfig[],
    staleTime: 60_000,
  });
}

export function useCreateFormField(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cfg: FormFieldConfig) =>
      client.post(FormFieldsEndpoints.create(eventId), cfg).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formFields", eventId] }),
  });
}

export function useUpdateFormField(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: FormFieldConfig) => {
      // now we read `cfg.id!` inside the mutation
      const res = await client.put(
        FormFieldsEndpoints.update(eventId, cfg.id!),
        cfg
      );
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["formFields", eventId] }),
  });
}

export function useDeleteFormField(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.delete(FormFieldsEndpoints.delete(eventId, id)).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formFields", eventId] }),
  });
}
