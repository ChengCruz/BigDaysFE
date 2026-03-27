// src/components/pages/Events/FormFieldsPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
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
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { NoEventsState } from "../../molecules/NoEventsState";
import { useEventContext } from "../../../context/EventContext";

export default function FormFieldsPage() {
  // ─── All hooks first (React Rules of Hooks) ─────────────────────────────────────────
  const { eventId } = useEventContext();
  const { data: fieldsRaw, isLoading, isError } = useFormFields(eventId);
  const createField = useCreateFormField(eventId);
  const updateField = useUpdateFormField(eventId);
  const deleteField = useDeleteFormField(eventId);

  const [modal, setModal] = useState<{
    open: boolean;
    initial?: FormFieldConfig & { questionId: string };
  }>({ open: false });

  const [editWarning, setEditWarning] = useState<{
    open: boolean;
    field?: FormFieldConfig & { questionId: string };
  }>({ open: false });

  const [deleteWarning, setDeleteWarning] = useState<{
    open: boolean;
    field?: FormFieldConfig;
  }>({ open: false });

  // Always work with an array
  const fields = useMemo<FormFieldConfig[]>(
    () => (Array.isArray(fieldsRaw) ? fieldsRaw : []),
    [fieldsRaw]
  );

  // ─── Early returns AFTER all hooks ─────────────────────────────────────────

  // Show "no events" state if no event ID exists (check BEFORE loading state)
  if (!eventId) return <NoEventsState title="No Event Selected" message="Create your first event to start customizing your RSVP form fields." />;

  if (isLoading) return <PageLoader />;
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
                  onClick={() => {
                    const field = f as FormFieldConfig & { questionId: string };
                    if (f.hasExistingAnswers) {
                      setEditWarning({ open: true, field });
                    } else {
                      setModal({ open: true, initial: field });
                    }
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (f.questionId) {
                      if (f.hasExistingAnswers) {
                        setDeleteWarning({ open: true, field: f });
                      } else {
                        deleteField.mutate({ questionId: f.questionId!, eventId: eventId! });
                      }
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit warning — shown when a question already has answers */}
      {editWarning.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-amber-600 dark:text-amber-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit question with existing responses?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Guests have already answered this question. Editing it will not affect their existing responses, which were saved at the time of submission.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditWarning({ open: false })}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => {
                const field = editWarning.field!;
                setEditWarning({ open: false });
                setModal({ open: true, initial: field });
              }}>
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete warning — shown when a question already has answers */}
      <DeleteConfirmationModal
        isOpen={deleteWarning.open}
        isDeleting={deleteField.isPending}
        title="Delete question with existing responses?"
        description="Guests have already answered this question. Their responses will be preserved even after deletion."
        confirmLabel="Delete Anyway"
        onCancel={() => setDeleteWarning({ open: false })}
        onConfirm={() => {
          deleteField.mutate({ questionId: deleteWarning.field!.questionId!, eventId: eventId! });
          setDeleteWarning({ open: false });
        }}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <span className="font-medium">"{deleteWarning.field?.label ?? deleteWarning.field?.text}"</span>?
        </p>
      </DeleteConfirmationModal>

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
                questionId: modal.initial.questionId.toString(),
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
