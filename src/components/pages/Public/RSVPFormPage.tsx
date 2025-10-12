// src/components/pages/Public/RSVPFormPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFormFields, type FormFieldConfig } from "../../../api/hooks/useFormFieldsApi";
import { useMutation } from "@tanstack/react-query";
import client from "../../../api/client";
import { Button } from "../../atoms/Button";
import { FormField } from "../../molecules/FormField";

export default function RSVPFormPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: fields, isLoading } = useFormFields(eventId!);
  const nav = useNavigate();
  const submit = useMutation({
    mutationFn: async (data: Record<string, any>) =>
      client.post(`/events/${eventId}/rsvps/public`, data),
  });

  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (fields) {
      const init: Record<string, any> = {};
      (fields as FormFieldConfig[]).forEach((f: FormFieldConfig) => {
        const key = f.name ?? f.id ?? f.questionId ?? "";
        if (key) init[key] = "";
      });
      setValues(init);
    }
  }, [fields]);

  if (isLoading) return <p>Loading form…</p>;

  const handleChange = (name: string, v: any) =>
    setValues((vals) => ({ ...vals, [name]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit.mutateAsync(values);
    alert("Thanks for RSVPing!");
    nav("/");
  };

  return (
    <section className="max-w-md mx-auto p-6 bg-background text-text space-y-6">
      <h2 className="text-2xl font-semibold text-primary text-center">RSVP</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(fields as FormFieldConfig[] | undefined)?.map((f: FormFieldConfig) => {
          const key = f.name ?? f.id ?? f.questionId ?? "";
          return (
          <div key={key}>
            <label className="block mb-1">
              {f.label ?? f.text}
              {f.isRequired && "*"}
            </label>
            {f.typeKey === "textarea" ? (
              <textarea
                required={f.isRequired}
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full border rounded p-2"
              />
            ) : f.typeKey === "select" ? (
              <select
                required={f.isRequired}
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">Select…</option>
                {Array.isArray(f.options) && f.options.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <FormField
                type={f.typeKey as any}
                required={f.isRequired}
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                label={""}
              />
            )}
          </div>
        )})}
        <Button type="submit" variant="primary" loading={submit.isPending}>
          {submit.isPending ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </section>
  );
}
