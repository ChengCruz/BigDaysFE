// src/components/pages/Public/RSVPPublic/RSVPPublicPage.tsx
// Token-based guest RSVP page.
// Route: /rsvp/submit/:token
// 1. Fetches the admin's RSVP design by token (API → localStorage fallback).
// 2. Form field configs are embedded in the design (no separate auth-only call).
// 3. Renders the designed layout with live form inputs via RsvpFormRenderer.
// 4. On submit, posts answers to the public RSVP API.
// 5. Shows RsvpSuccessScreen after a successful submission.
import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Spinner } from "../../../atoms/Spinner";
import {
  usePublicRsvpDesign,
  useSubmitPublicRsvp,
} from "../../../../api/hooks/usePublicRsvpApi";
import RsvpFormRenderer from "./RsvpFormRenderer";
import RsvpSuccessScreen from "./RsvpSuccessScreen";

export default function RSVPPublicPage() {
  const { token } = useParams<{ token: string }>();

  // Load the design by token (formFieldConfigs are embedded in the design)
  const { data: design, isLoading: loadingDesign } = usePublicRsvpDesign(token);

  const submitMutation = useSubmitPublicRsvp();
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  // ── Loading ───────────────────────────────────────────────────────────
  if (loadingDesign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <Spinner />
        <p className="text-sm text-white/50">Loading invitation...</p>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────
  if (!design || !design.blocks?.length) {
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
          <h1 className="text-2xl font-bold text-white">Invalid or expired link</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            This RSVP link doesn't exist or has expired. Please contact the host for the correct link.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────
  if (submitted) {
    return <RsvpSuccessScreen guestName={submittedName} design={design} />;
  }

  // ── RSVP form ────────────────────────────────────────────────────────
  return (
    <RsvpFormRenderer
      design={design}
      formFields={design.formFieldConfigs ?? []}
      eventId={design.eventGuid ?? ""}
      onSubmit={async (payload) => {
        try {
          await submitMutation.mutateAsync(payload);
          setSubmittedName(payload.guestName);
          setSubmitted(true);
        } catch {
          toast.error("Failed to submit your RSVP. Please try again.");
        }
      }}
      isSubmitting={submitMutation.isPending}
    />
  );
}
