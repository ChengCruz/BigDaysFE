// src/components/pages/Events/FormFieldsPage.tsx
import { useState } from "react";
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  type FormFieldConfig,
} from "../../../api/hooks/useFormFieldsApi";
import { Button } from "../../atoms/Button";
import { FormFieldModal } from "../../molecules/FormFieldModal";
import { useEventContext } from "../../../context/EventContext";

export default function FormFieldsPage() {
  const { eventId } = useEventContext();
  const { data: fields = [], isLoading } = useFormFields(eventId!);
  const createField = useCreateFormField(eventId!);
  const updateField = useUpdateFormField(eventId!);
  const deleteField = useDeleteFormField(eventId!);

  const [modal, setModal] = useState<{
    open: boolean;
    initial?: FormFieldConfig;
  }>({ open: false });

  if (isLoading) return <p>Loading form fields…</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Custom RSVP Fields</h2>
        <Button onClick={() => setModal({ open: true })}>+ New Field</Button>
      </div>

      <ul className="space-y-2">
        {fields.map((f) => (
          <li
            key={f.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{f.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {f.type} {f.required && "· required"}
              </p>
            </div>
            <div className="space-x-2">
              <Button
                variant="secondary"
                onClick={() => setModal({ open: true, initial: f })}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteField.mutate(f.id!)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {modal.open && (
        <FormFieldModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false })}
          initial={modal.initial}
          onSave={(cfg) => {
            if (modal.initial) {
              updateField.mutate({ ...modal.initial, ...cfg });
            } else {
              createField.mutate(cfg);
            }
            setModal({ open: false });
          }}
        />
      )}
    </>
  );
}
