// src/components/pages/Events/CoupleQuestionsPage.tsx
//
// Couple-mode "What to ask": step 1 of the guest flow on CoupleGuestsPage.
// Same route as planner mode (/app/form-fields), same hooks, same API contract;
// only the body differs. See docs/COUPLE_MODE.md and routes.tsx:FormFieldsRoute.
//
// ── Two backend facts this page is built around (verified in MyBigDays_Mono) ──
//
// 1. `hasExistingAnswers` DOES NOT EXIST on the backend. FormFieldConfig carries
//    the field and useFormFieldsApi defaults it to `false`, so planner mode's
//    "this question has answers" warning can never fire. The real signal is
//    reactive, not predictive: POST /question/Update returns HTTP *200* with
//    `statusCode: 422` INSIDE the envelope when any answer already exists
//    (QuestionService.UpdateQuestion). Nothing in client.ts turns that into a
//    rejection, so react-query calls it a success. This page reads the envelope
//    itself (see envelopeError()) and shows the couple what actually happened
//    instead of silently closing the modal on a save that never landed.
//
// 2. Update is a FULL REPLACE, not a patch. AssignEventsParam assigns all six
//    fields unconditionally, so an omitted field is wiped to its CLR default
//    (options → null, isRequired → false, order → 0). FormFieldModal already
//    builds a complete payload, which is why it is reused verbatim here rather
//    than reimplemented with a couple-friendly subset of inputs.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PencilIcon, TrashIcon, EyeIcon, EyeOffIcon, PlusIcon } from "@heroicons/react/solid";

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
import { PageLoader } from "../../atoms/PageLoader";
import { ErrorState } from "../../atoms/ErrorState";
import { Button } from "../../atoms/Button";
import { FormFieldModal } from "../../molecules/FormFieldModal";
import { DeleteConfirmationModal } from "../../molecules/DeleteConfirmationModal";
import { NoEventsState } from "../../molecules/NoEventsState";
import { QuestionTemplateModal } from "../../molecules/QuestionTemplateModal";
import type { QuestionTemplate } from "../../../utils/formFieldTemplates";
import { useEventContext } from "../../../context/EventContext";
import { envelopeError } from "../../../utils/apiEnvelope";

/** Planner mode says "Short Text"; a couple is choosing how a guest answers. */
const ANSWER_LABELS: Record<string, string> = {
  text: "Short answer",
  textarea: "Long answer",
  select: "Pick one from a list",
  radio: "Pick one",
  checkbox: "Tick box",
  email: "Email address",
  number: "Number",
  date: "Date",
};

function answerLabel(f: FormFieldConfig): string {
  return ANSWER_LABELS[f.typeKey as string] ?? "Short answer";
}

export default function CoupleQuestionsPage() {
  const navigate = useNavigate();
  const { eventId, eventsLoading } = useEventContext()!;

  const { data: fieldsRaw, isLoading, isError } = useFormFields(eventId);
  const createField = useCreateFormField(eventId);
  const updateField = useUpdateFormField(eventId);
  const activateField = useActivateFormField(eventId);
  const deactivateField = useDeactivateFormField(eventId);
  const deleteField = useDeleteFormField(eventId);

  const [modal, setModal] = useState<{ open: boolean; initial?: FormFieldConfig }>({ open: false });
  const [templateModal, setTemplateModal] = useState(false);
  const [addingTemplates, setAddingTemplates] = useState(false);
  const [hideTarget, setHideTarget] = useState<FormFieldConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormFieldConfig | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  // Save/edit failures show inside the modal itself (see FormFieldModal's onSave
  // below) rather than on the page banner, so the refusal lands right where the
  // couple just clicked Save instead of behind a modal that already closed.
  const [modalError, setModalError] = useState<string | null>(null);

  const fields = useMemo<FormFieldConfig[]>(
    () => (Array.isArray(fieldsRaw) ? [...fieldsRaw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []),
    [fieldsRaw]
  );

  async function handleAddTemplates(selected: QuestionTemplate[]) {
    if (!eventId) return;
    setAddingTemplates(true);
    setBanner(null);
    try {
      for (const tpl of selected) {
        const res = await createField.mutateAsync({
          text: tpl.text,
          type: tpl.type,
          isRequired: tpl.isRequired,
          options: tpl.options ?? "",
          order: tpl.order,
          eventGuid: eventId,
        });
        const err = envelopeError(res);
        if (err) {
          setBanner(err);
          break;
        }
      }
    } catch {
      setBanner("We couldn’t add those questions. Please try again.");
    } finally {
      setAddingTemplates(false);
      setTemplateModal(false);
    }
  }

  if (eventsLoading || isLoading) return <PageLoader />;
  if (!eventId) {
    return (
      <NoEventsState
        title="No event yet"
        message="Create your event first, then you can choose what to ask your guests."
      />
    );
  }
  if (isError) return <ErrorState message="We couldn’t load your questions." />;

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate("/app/guests")}
            className="self-start text-[12px] font-semibold text-text/45 transition-colors hover:text-text/70"
          >
            ← Back to guests
          </button>
          <h1 className="font-display text-3xl font-semibold text-text">What to ask</h1>
          <p className="text-sm text-text/60">
            The questions your guests answer when they reply to your invite. Once a guest
            has answered a question, it can’t be edited; hide it instead if you no longer
            want to ask it.
          </p>
        </div>
        <Button onClick={() => { setModalError(null); setModal({ open: true }); }} className="whitespace-nowrap">
          <PlusIcon className="mr-1 h-4 w-4" />
          Add a question
        </Button>
      </div>

      {/* Surfaces the 200-with-422-inside case described at the top of the file. */}
      {banner && (
        <div
          role="alert"
          className="rounded-xl border border-sect-home/40 bg-sect-home/10 px-4 py-3 text-sm text-text"
        >
          {banner}
        </div>
      )}

      {/* ─── The questions ───────────────────────────────────────────────── */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-white px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-text">No questions yet</p>
          <p className="max-w-sm text-sm text-text/60">
            Everyone is asked their name and how many are coming. Add a question for anything else,
            like meal choice, song requests, or whether they need a room.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Button onClick={() => { setModalError(null); setModal({ open: true }); }}>Add a question</Button>
            <Button variant="secondary" onClick={() => setTemplateModal(true)}>
              Start from examples
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {fields.map((f) => {
              const hidden = f.isActive === false;
              return (
                <li
                  key={f.questionId ?? f.id}
                  className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    hidden ? "border-primary/10 bg-white/60" : "border-primary/15 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`break-words text-[14.5px] font-semibold ${
                        hidden ? "text-text/40" : "text-text"
                      }`}
                    >
                      {f.label || f.text}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-text/55">
                      <span>{answerLabel(f)}</span>
                      {f.isRequired && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Must answer</span>
                        </>
                      )}
                      {hidden && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-text/45">Hidden from invite</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${f.label || f.text}`}
                      title="Edit"
                      onClick={() => { setModalError(null); setModal({ open: true, initial: f }); }}
                      className="rounded-lg p-2 text-text/55 transition-colors hover:bg-primary/10 hover:text-text"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={
                        hidden
                          ? `Show ${f.label || f.text} on the invite`
                          : `Hide ${f.label || f.text} from the invite`
                      }
                      title={hidden ? "Show on invite" : "Hide from invite"}
                      onClick={() => {
                        if (!f.questionId) return;
                        setBanner(null);
                        if (hidden) {
                          activateField.mutate({ questionId: f.questionId, eventId: eventId! });
                        } else {
                          setHideTarget(f);
                        }
                      }}
                      className="rounded-lg p-2 text-text/55 transition-colors hover:bg-primary/10 hover:text-text"
                    >
                      {hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${f.label || f.text}`}
                      title="Delete"
                      onClick={() => {
                        if (f.questionId) setDeleteTarget(f);
                      }}
                      className="rounded-lg p-2 text-text/45 transition-colors hover:bg-secondary/10 hover:text-secondary"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <Button variant="secondary" className="w-full" onClick={() => setTemplateModal(true)}>
            Browse example questions
          </Button>
        </>
      )}

      <p className="text-center text-[11.5px] text-text/40">
        Hidden questions stay off your invite but keep every answer guests already gave.
      </p>

      {/* ─── Hide confirmation ───────────────────────────────────────────── */}
      <DeleteConfirmationModal
        isOpen={!!hideTarget}
        isDeleting={deactivateField.isPending}
        title="Hide this question?"
        description="It comes off your invite straight away. Answers guests already gave are kept, and you can show it again whenever you like."
        confirmLabel="Hide it"
        onCancel={() => setHideTarget(null)}
        onConfirm={() => {
          const target = hideTarget;
          setHideTarget(null);
          if (target?.questionId) {
            deactivateField.mutate({ questionId: target.questionId, eventId: eventId! });
          }
        }}
      >
        <p className="text-sm text-text/70">
          “{hideTarget?.label || hideTarget?.text}” will no longer be asked.
        </p>
      </DeleteConfirmationModal>

      {/* ─── Delete confirmation ─────────────────────────────────────────── */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        isDeleting={deleteField.isPending}
        title="Delete this question for good?"
        description="This cannot be undone. If you only want it off your invite for now, hide it instead."
        confirmLabel="Delete for good"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target?.questionId) {
            deleteField.mutate({ questionId: target.questionId, eventId: eventId! });
          }
        }}
      >
        <p className="text-sm text-text/70">
          “{deleteTarget?.label || deleteTarget?.text}” will be removed permanently.
        </p>
      </DeleteConfirmationModal>

      <QuestionTemplateModal
        isOpen={templateModal}
        onClose={() => setTemplateModal(false)}
        onAdd={handleAddTemplates}
        isLoading={addingTemplates}
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
                    : typeof modal.initial.options === "string"
                    ? modal.initial.options
                    : undefined,
                }
              : undefined
          }
          onSave={async (dto) => {
            if (!eventId) return;
            setModalError(null);

            // Every field, every time: update is a full replace (see header).
            const payload: QuestionPayload = {
              text: dto.text ?? "",
              type: dto.type,
              isRequired: dto.isRequired,
              options: dto.options ?? "",
              order: dto.order,
              eventGuid: eventId,
            };

            const editingId = modal.initial?.questionId ?? modal.initial?.id;

            try {
              const res = editingId
                ? await updateField.mutateAsync({ ...payload, questionId: String(editingId) })
                : await createField.mutateAsync(payload);
              const err = envelopeError(res);
              if (err) {
                setModalError(err);
                return;
              }
            } catch {
              setModalError("We couldn’t save that question. Please try again.");
              return;
            }
            setModal({ open: false });
          }}
        />
      )}
    </div>
  );
}
