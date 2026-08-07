// src/components/pages/Events/FormFieldsPage.tsx
//
// Planner-mode question builder. Couple mode renders CoupleQuestionsPage from the
// same route against the same hooks — see routes.tsx:FormFieldsRoute.
//
// Every write here goes through runWrite() because the question endpoints report
// refusals inside a HTTP 200 envelope rather than as a 4xx (utils/apiEnvelope):
// POST /question/Update answers `statusCode: 422` when the question already has
// answers, and the toggles do the same when the save writes no rows. Calling
// mutate() and closing the modal on a resolved promise showed a success the
// backend never granted.
import { PageLoader } from "../../atoms/PageLoader";
import { useMemo, useState } from "react";
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useActivateFormField,
  useDeactivateFormField,
  useDeleteFormField,
  type FormFieldConfig,
  type QuestionPayload,
} from "../../../api/hooks/useFormFieldsApi";
import { Button } from "../../atoms/Button";
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/solid";
import { FormFieldModal, TYPE_LABELS } from "../../molecules/FormFieldModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { NoEventsState } from "../../molecules/NoEventsState";
import { useEventContext } from "../../../context/EventContext";
import { QuestionTemplateModal } from "../../molecules/QuestionTemplateModal";
import type { QuestionTemplate } from "../../../utils/formFieldTemplates";
import { envelopeError } from "../../../utils/apiEnvelope";

export default function FormFieldsPage() {
  // ─── All hooks first (React Rules of Hooks) ─────────────────────────────────────────
  const { eventId } = useEventContext();
  const { data: fieldsRaw, isLoading, isError } = useFormFields(eventId);
  const createField = useCreateFormField(eventId);
  const updateField = useUpdateFormField(eventId);
  const activateField = useActivateFormField(eventId);
  const deactivateField = useDeactivateFormField(eventId);
  const deleteField = useDeleteFormField(eventId);

  const [modal, setModal] = useState<{
    open: boolean;
    initial?: FormFieldConfig & { questionId: string };
  }>({ open: false });

  const [templateModal, setTemplateModal] = useState(false);
  const [isAddingTemplates, setIsAddingTemplates] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  // Save/edit failures (e.g. backend refusing an edit to an answered question) show
  // inside the modal itself rather than on this page banner — see FormFieldModal's
  // onSave below, which keeps the modal open until the write actually lands.
  const [modalError, setModalError] = useState<string | null>(null);

  const [editWarning, setEditWarning] = useState<{
    open: boolean;
    field?: FormFieldConfig & { questionId: string };
  }>({ open: false });

  const [activateWarning, setActivateWarning] = useState<{
    open: boolean;
    field?: FormFieldConfig;
  }>({ open: false });

  const [deactivateWarning, setDeactivateWarning] = useState<{
    open: boolean;
    field?: FormFieldConfig;
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

  /**
   * Single funnel for every question write. A resolved mutation is not proof the
   * write landed — the refusal may be inside the envelope — so the result is
   * checked before the caller reports success. Returns false when it failed.
   */
  async function runWrite(write: () => Promise<unknown>, fallback: string): Promise<boolean> {
    setBanner(null);
    try {
      const err = envelopeError(await write());
      if (err) setBanner(err);
      return !err;
    } catch {
      setBanner(fallback);
      return false;
    }
  }

  async function handleAddTemplates(selected: QuestionTemplate[]) {
    if (!eventId) return;
    setIsAddingTemplates(true);
    for (const tpl of selected) {
      const ok = await runWrite(
        () =>
          createField.mutateAsync({
            text: tpl.text,
            type: tpl.type,
            isRequired: tpl.isRequired,
            options: tpl.options ?? "",
            order: tpl.order,
            eventGuid: eventId,
          }),
        "We couldn’t add those fields. Please try again."
      );
      if (!ok) break;
    }
    setIsAddingTemplates(false);
    setTemplateModal(false);
  }

  // ─── Early returns AFTER all hooks ─────────────────────────────────────────

  // Show "no events" state if no event ID exists (check BEFORE loading state)
  if (!eventId) return <NoEventsState title="No Event Selected" message="Create your first event to start customizing your RSVP form fields." />;

  if (isLoading) return <PageLoader />;
  if (isError) return <p>Failed to load form fields.</p>;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-1">
        <h2 className="text-2xl font-semibold">Custom RSVP Fields</h2>
        <div data-tour="formfields-actions" className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setTemplateModal(true)} className="whitespace-nowrap">+ Add from Template</Button>
          <Button onClick={() => { setModalError(null); setModal({ open: true }); }} className="whitespace-nowrap">+ New Field</Button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Once a guest has answered a question, it can’t be edited — hide it instead if you no longer want to ask it.
      </p>

      {/* Surfaces the 200-with-the-refusal-inside case described at the top of the file. */}
      {banner && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200"
        >
          {banner}
        </div>
      )}

      {fields.length === 0 ? (
        <div data-tour="formfields-list" className="text-center text-gray-500 py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p>No custom fields yet.</p>
          <p className="mt-2">
            Click <span className="font-semibold">“+ New Field”</span> to add
            one.
          </p>
        </div>
      ) : (
        <ul data-tour="formfields-list" className="space-y-2">
          {fields.map((f) => {
            return (
            <li
              key={f.questionId ?? f.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium break-words">{f.label ?? f.text}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {TYPE_LABELS[f.typeKey as keyof typeof TYPE_LABELS] ?? f.typeKey ?? String(f.type)} · Order: {f.order ?? "—"}{f.isRequired && " · Required"}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
                <button
                  title="Edit"
                  onClick={() => {
                    const field = f as FormFieldConfig & { questionId: string };
                    setModalError(null);
                    if (f.hasExistingAnswers) {
                      setEditWarning({ open: true, field });
                    } else {
                      setModal({ open: true, initial: field });
                    }
                  }}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-accent dark:border-white/10 dark:text-white dark:hover:bg-white/10 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {f.isActive === false ? (
                  <button
                    title="Activate question"
                    onClick={() => { if (f.questionId) setActivateWarning({ open: true, field: f }); }}
                    className="p-2 rounded-lg bg-white border border-green-200 text-green-700 hover:bg-green-50 dark:bg-accent dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    title="Deactivate question"
                    onClick={() => { if (f.questionId) setDeactivateWarning({ open: true, field: f }); }}
                    className="p-2 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 dark:bg-accent dark:border-amber-700/40 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  title="Delete"
                  onClick={() => { if (f.questionId) setDeleteWarning({ open: true, field: f }); }}
                  className="p-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 dark:bg-accent dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
            );
          })}
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
                setModalError(null);
                setModal({ open: true, initial: field });
              }}>
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activate confirmation */}
      <DeleteConfirmationModal
        isOpen={activateWarning.open}
        isDeleting={activateField.isPending}
        title="Reactivate question?"
        description="This question will be shown again on your RSVP form."
        confirmLabel="Activate"
        onCancel={() => setActivateWarning({ open: false })}
        onConfirm={() => {
          const field = activateWarning.field!;
          setActivateWarning({ open: false });
          void runWrite(
            () => activateField.mutateAsync({ questionId: field.questionId!, eventId: eventId! }),
            "We couldn’t reactivate that field. Please try again."
          );
        }}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to reactivate <span className="font-medium">"{activateWarning.field?.label ?? activateWarning.field?.text}"</span>?
        </p>
      </DeleteConfirmationModal>

      {/* Deactivate confirmation */}
      <DeleteConfirmationModal
        isOpen={deactivateWarning.open}
        isDeleting={deactivateField.isPending}
        title="Deactivate question?"
        description="This question will be hidden from your RSVP form. Guest responses are preserved and the question can be reactivated."
        confirmLabel="Deactivate"
        onCancel={() => setDeactivateWarning({ open: false })}
        onConfirm={() => {
          const field = deactivateWarning.field!;
          setDeactivateWarning({ open: false });
          void runWrite(
            () => deactivateField.mutateAsync({ questionId: field.questionId!, eventId: eventId! }),
            "We couldn’t deactivate that field. Please try again."
          );
        }}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to deactivate <span className="font-medium">"{deactivateWarning.field?.label ?? deactivateWarning.field?.text}"</span>?
        </p>
      </DeleteConfirmationModal>

      {/* Delete confirmation — permanent, cannot be referenced back */}
      <DeleteConfirmationModal
        isOpen={deleteWarning.open}
        isDeleting={deleteField.isPending}
        title="Permanently delete question?"
        description="This question and all its data will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete Permanently"
        onCancel={() => setDeleteWarning({ open: false })}
        onConfirm={() => {
          const field = deleteWarning.field!;
          setDeleteWarning({ open: false });
          void runWrite(
            () => deleteField.mutateAsync({ questionId: field.questionId!, eventId: eventId! }),
            "We couldn’t delete that field. Please try again."
          );
        }}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to permanently delete <span className="font-medium">"{deleteWarning.field?.label ?? deleteWarning.field?.text}"</span>?
        </p>
      </DeleteConfirmationModal>

      <QuestionTemplateModal
        isOpen={templateModal}
        onClose={() => setTemplateModal(false)}
        onAdd={handleAddTemplates}
        isLoading={isAddingTemplates}
      />

      {modal.open && (
        <FormFieldModal
          isOpen={modal.open}
          onClose={() => { setModal({ open: false }); setModalError(null); }}
          error={modalError}
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
          onSave={async (dto) => {
            if (!eventId) return;

            // Build the payload the API expects (QuestionDto shape). Every field,
            // every time — Update is a full replace, so an omitted one is wiped to
            // its CLR default.
            const payload: QuestionPayload = {
              text: dto.text ?? "",
              type: dto.type,
              isRequired: dto.isRequired,
              options: dto.options ?? "",
              order: dto.order,
              eventGuid: eventId,
            };

            const editingId = modal.initial?.questionId;

            try {
              const res = editingId
                ? // update expects an id; map from questionId
                  await updateField.mutateAsync({ ...payload, questionId: editingId.toString() })
                : await createField.mutateAsync(payload);
              const err = envelopeError(res);
              if (err) {
                setModalError(err);
                return;
              }
            } catch {
              setModalError("We couldn’t save that field. Please try again.");
              return;
            }
            setModal({ open: false });
          }}
        />
      )}
    </>
  );
}
