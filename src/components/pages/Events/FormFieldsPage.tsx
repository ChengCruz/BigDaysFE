// src/components/pages/Events/FormFieldsPage.tsx
import { useMemo, useState } from "react";
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  type FormFieldConfig,
  type QuestionPayload,
} from "../../../api/hooks/useFormFieldsApi";
import { Button } from "../../atoms/Button";
import { FormFieldModal } from "../../molecules/FormFieldModal";
import { useParams } from "react-router-dom";

export default function FormFieldsPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ?? "";

  const { data: fieldsRaw, isLoading, isError } = useFormFields(eventId);
  const createField = useCreateFormField();
  const updateField = useUpdateFormField();
  const deleteField = useDeleteFormField();

  const [modal, setModal] = useState<{
    open: boolean;
    initial?: FormFieldConfig & { questionId: string };
  }>({ open: false });

  // Always work with an array
  const fields = useMemo<FormFieldConfig[]>(
    () => (Array.isArray(fieldsRaw) ? fieldsRaw : []),
    [fieldsRaw]
  );

  if (isLoading) return <p>Loading form fields…</p>;
  if (isError) return <p>Failed to load form fields.</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Custom RSVP Fields</h2>
        <Button onClick={() => setModal({ open: true })}>+ New Field</Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p>No custom fields yet.</p>
          <p className="mt-2">
            Click <span className="font-semibold">“+ New Field”</span> to add
            one.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {fields.map((f) => (
            <li
              key={f.questionId ?? f.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{f.label ?? f.text}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {(typeof f.type === "number" ? f.type : f.typeKey ?? String(f.type))} {f.isRequired && "· required"}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setModal({
                      open: true,
                      initial: f as FormFieldConfig & { questionId: string },
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (f.questionId) deleteField.mutate();
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal.open && (
        <FormFieldModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false })}
          initial={
            modal.initial
              ? {
                  id: modal.initial.questionId ?? modal.initial.id,
                  text: modal.initial.text ?? modal.initial.label ?? "",
                  isRequired: modal.initial.isRequired ?? false,
                  order: modal.initial.order ?? 0,
                  type: modal.initial.type ?? 0,
                  options: Array.isArray(modal.initial.options)
                    ? modal.initial.options.join(",")
                    : (typeof modal.initial.options === "string" ? modal.initial.options : undefined),
                }
              : undefined
          }
          onSave={(dto) => {
            if (!eventId) return;

            // Build the payload the API expects (QuestionDto shape)
            const payload: QuestionPayload = {
              text: dto.text ?? "",
              type: dto.type,
              isRequired: dto.isRequired,
              options: dto.options ?? "",
              eventGuid: eventId,
            };

            if (modal.initial?.questionId) {
              // update expects an id; map from questionId
              updateField.mutate({
                ...payload,
                questionId: modal.initial.questionId,
              });
            } else {
              // create
              createField.mutate(payload);
            }

            setModal({ open: false });
          }}
        />
      )}
    </>
  );
}
