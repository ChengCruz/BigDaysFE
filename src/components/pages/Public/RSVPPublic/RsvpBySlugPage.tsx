// src/components/pages/Public/RSVPPublic/RsvpBySlugPage.tsx
// Slug-based public RSVP page.
// Route: /rsvp/:slug
// 1. Fetches event info + design + questions from GET /rsvp/{slug} (AllowAnonymous).
// 2. Renders the designed layout with live form inputs via RsvpFormRenderer.
// 3. On submit, posts answers to the public RSVP API.
// 4. Shows RsvpSuccessScreen after a successful submission.
import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Spinner } from "../../../atoms/Spinner";
import { useEventBySlug } from "../../../../api/hooks/useEventBySlugApi";
import { useSubmitPublicRsvp } from "../../../../api/hooks/usePublicRsvpApi";
import RsvpFormRenderer from "./RsvpFormRenderer";
import RsvpSuccessScreen from "./RsvpSuccessScreen";

export default function RsvpBySlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: template, isLoading, isError } = useEventBySlug(slug);

  const submitMutation = useSubmitPublicRsvp();
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <Spinner />
        <p className="text-sm text-white/50">Loading invitation...</p>
      </div>
    );
  }

  // ── Not found / error ────────────────────────────────────────────────
  if (isError || !template || !template.design?.blocks?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
            <svg
              className="h-8 w-8 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Invitation not found</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            This invitation link doesn't exist or has expired. Please contact the host for the correct link.
          </p>
        </div>
      </div>
    );
  }

  // ── RSVP expired ─────────────────────────────────────────────────────
  if (template.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
            <svg
              className="h-8 w-8 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">RSVP has closed</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            The RSVP deadline for this event has passed. Please contact the host if you need assistance.
          </p>
          {template.rsvpDueDate && (
            <p className="text-xs text-white/30">
              Deadline was {new Date(template.rsvpDueDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────
  if (submitted) {
    return <RsvpSuccessScreen guestName={submittedName} design={template.design} slug={slug!} />;
  }

  // ── RSVP form ────────────────────────────────────────────────────────
  return (
    <RsvpFormRenderer
      design={template.design}
      formFields={template.formFields}
      eventId={template.eventId}
      onSubmit={async (payload) => {
        try {
          await submitMutation.mutateAsync(payload);
          setSubmittedName(payload.guestName);
          setSubmitted(true);
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to submit your RSVP. Please try again.";
          toast.error(msg);
        }
      }}
      isSubmitting={submitMutation.isPending}
    />
  );
}
