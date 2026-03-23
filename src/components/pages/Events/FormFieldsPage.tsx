// src/components/pages/Events/FormFieldsPage.tsx
import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { useMemo, useState } from "react";
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useActivateFormField,
  useDeactivateFormField,
  useDeleteFormField,
  type FormFieldConfig,
} from "../../../api/hooks/useFormFieldsApi";
import { Button } from "../../atoms/Button";
import { FormFieldModal } from "../../molecules/FormFieldModal";
import { QuestionTemplateModal } from "../../molecules/QuestionTemplateModal";
import { useParams, useNavigate } from "react-router-dom";
import { NoEventsState } from "../../molecules/NoEventsState";
import { useEventContext } from "../../../context/EventContext";
import { ArrowLeftIcon, PencilAltIcon, TrashIcon, CheckCircleIcon, BanIcon } from "@heroicons/react/solid";
import { TYPE_LABELS } from "../../molecules/FormFieldModal";
import type { QuestionTemplate } from "../../../utils/formFieldTemplates";

export default function FormFieldsPage() {
  // ─── All hooks first (React Rules of Hooks) ─────────────────────────────────────────
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { eventsLoading, event } = useEventContext()!;
  const eventId = id ?? event?.id ?? "";
  const { data: fieldsRaw, isLoading, isError } = useFormFields(eventId);
  const createField = useCreateFormField();
  const updateField = useUpdateFormField();
  const activateField = useActivateFormField(eventId);
  const deactivateField = useDeactivateFormField(eventId);
  const deleteField = useDeleteFormField(eventId);

  const [modal, setModal] = useState<{
    open: boolean;
    initial?: FormFieldConfig & { questionId: string };
  }>({ open: false });
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [addingTemplates, setAddingTemplates] = useState(false);

  // Always work with an array
  const fields = useMemo<FormFieldConfig[]>(
    () => (Array.isArray(fieldsRaw) ? fieldsRaw : []),
    [fieldsRaw]
  );

  // ─── Early returns AFTER all hooks ─────────────────────────────────────────
  if (eventsLoading) return <PageLoader message="Loading..." />;
  if (!eventId) return <NoEventsState title="No Event Selected" message="Create your first event to start customizing your RSVP form questions." />;
  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState message="Failed to load questions." onRetry={() => window.location.reload()} />;

  return (
    <>
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => navigate("/app/events")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Events
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">RSVP Questions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Customize the questions guests answer when submitting an RSVP.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTemplateModalOpen(true)}>
            Add from Template
          </Button>
          <Button onClick={() => setModal({ open: true })}>+ New Question</Button>
        </div>
      </div>

      {/* ─── List ─────────────────────────────────────────────────────────────── */}
      {fields.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="font-medium">No questions yet.</p>
          <p className="mt-1 text-sm">Click <span className="font-semibold">"+ New Question"</span> to add one.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {fields.map((f) => {
            const typeLabel = f.typeKey ? TYPE_LABELS[f.typeKey] : String(f.type ?? "");
            return (
              <li
                key={f.questionId ?? f.id}
                className="px-5 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex justify-between items-center gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.label ?? f.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {typeLabel}
                    </span>
                    {f.isRequired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                        Required
                      </span>
                    )}
                    <span className="text-xs text-gray-400">Order: {f.order ?? 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Status pill toggle */}
                  <button
                    onClick={() => {
                      if (!f.questionId) return;
                      const payload = { eventId, questionId: f.questionId, isActive: !f.isActive };
                      f.isActive
                        ? deactivateField.mutate({ ...payload, isActive: false })
                        : activateField.mutate({ ...payload, isActive: true });
                    }}
                    title={f.isActive ? "Click to deactivate" : "Click to activate"}
                    className={`group inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      f.isActive
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 focus:ring-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-700"
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 focus:ring-gray-300 dark:bg-gray-700/60 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 dark:hover:border-green-700"
                    }`}
                  >
                    {f.isActive ? (
                      <>
                        <CheckCircleIcon className="w-3.5 h-3.5 group-hover:hidden" />
                        <BanIcon className="w-3.5 h-3.5 hidden group-hover:block" />
                        <span className="group-hover:hidden">Active</span>
                        <span className="hidden group-hover:inline">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <BanIcon className="w-3.5 h-3.5 group-hover:hidden" />
                        <CheckCircleIcon className="w-3.5 h-3.5 hidden group-hover:block" />
                        <span className="group-hover:hidden">Inactive</span>
                        <span className="hidden group-hover:inline">Activate</span>
                      </>
                    )}
                  </button>

                  <span className="w-px h-5 bg-gray-200 dark:bg-white/10" />

                  {/* Edit icon button */}
                  <button
                    onClick={() =>
                      setModal({
                        open: true,
                        initial: f as FormFieldConfig & { questionId: string },
                      })
                    }
                    title="Edit"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 transition focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1"
                  >
                    <PencilAltIcon className="w-4 h-4" />
                  </button>

                  {/* Delete icon button */}
                  <button
                    onClick={() => {
                      if (!f.questionId) return;
                      deleteField.mutate({ eventId, questionId: f.questionId, isActive: false });
                    }}
                    title="Delete"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ─── Template Picker Modal ──────────────────────────────────────────── */}
      <QuestionTemplateModal
        isOpen={templateModalOpen}
        isLoading={addingTemplates}
        onClose={() => setTemplateModalOpen(false)}
        onAdd={async (selected: QuestionTemplate[]) => {
          if (!eventId) return;
          setAddingTemplates(true);
          const maxOrder = fields.reduce((max, f) => Math.max(max, f.order ?? 0), 0);
          for (let i = 0; i < selected.length; i++) {
            const tpl = selected[i];
            await createField.mutateAsync({
              eventGuid: eventId,
              text: tpl.text,
              type: tpl.type,
              isRequired: tpl.isRequired,
              options: tpl.options ?? "",
              order: maxOrder + i + 1,
            });
          }
          setAddingTemplates(false);
          setTemplateModalOpen(false);
        }}
      />

      {/* ─── Modal ────────────────────────────────────────────────────────────── */}
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

            if (modal.initial?.questionId) {
              updateField.mutate({
                questionId: modal.initial.questionId,
                eventGuid: eventId,
                text: dto.text ?? "",
                type: dto.type,
                isRequired: dto.isRequired,
                options: dto.options ?? "",
                order: dto.order ?? 0,
              });
            } else {
              createField.mutate({
                eventGuid: eventId,
                text: dto.text ?? "",
                type: dto.type,
                isRequired: dto.isRequired,
                options: dto.options ?? "",
                order: dto.order ?? 0,
              });
            }

            setModal({ open: false });
          }}
        />
      )}
    </>
  );
}
