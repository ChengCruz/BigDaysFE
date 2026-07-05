import { useEffect, useState } from "react";
import { MailIcon, CheckCircleIcon } from "@heroicons/react/solid";
import toast from "react-hot-toast";
import { Button } from "../../atoms/Button";
import { useAuth } from "../../../api/hooks/useAuth";
import { useUserByGuidApi } from "../../../api/hooks/useUsersApi";
import { useEventContext } from "../../../context/EventContext";
import { useSendSupportMessage } from "../../../api/hooks/useContactApi";

const CATEGORIES = [
  "Bug Report",
  "Feature Request",
  "Billing / Payment",
  "Question",
  "Other",
] as const;

const fieldClass =
  "w-full rounded-xl border border-primary/15 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-accent dark:text-white";

const readOnlyClass =
  "w-full rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5 text-sm text-text/70 dark:border-white/10 dark:bg-white/5 dark:text-white/60";

const labelClass = "block text-xs font-semibold text-text/60 dark:text-white/50 mb-1.5";

export default function ContactSupportPage() {
  const { user, userGuid } = useAuth();
  const { data: profile } = useUserByGuidApi(userGuid ?? "");
  const { events, eventId, eventsLoading } = useEventContext();
  const sendMessage = useSendSupportMessage();

  const name = profile?.fullName ?? user?.email ?? "";
  const email = user?.email ?? "";

  const [selectedEventId, setSelectedEventId] = useState<string>(eventId ?? "");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [message, setMessage] = useState("");

  // Default the event selector to the active event once it resolves.
  useEffect(() => {
    if (eventId && !selectedEventId) setSelectedEventId(eventId);
  }, [eventId, selectedEventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }
    const selectedEvent = events?.find((ev) => ev.id === selectedEventId);
    try {
      await sendMessage.mutateAsync({
        eventGuid: selectedEventId || undefined,
        eventName: selectedEvent?.title,
        category,
        message: message.trim(),
      });
      toast.success("Thanks! Your message has been sent — we'll be in touch.");
      setMessage("");
    } catch {
      toast.error("Couldn't send your message. Please try again in a moment.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white flex-shrink-0">
            <MailIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text dark:text-white">Contact Us</h1>
            <p className="text-sm text-text/60 dark:text-white/50">
              Found a bug or have feedback? Send us a message and we'll get back to you.
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Your Name</label>
            <input type="text" value={name} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} readOnly className={readOnlyClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className={fieldClass}
              disabled={eventsLoading}
            >
              <option value="">
                {eventsLoading ? "Loading events…" : "— No specific event —"}
              </option>
              {events?.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="Describe the bug or share your feedback. If it's a bug, tell us what you did and what you expected to happen."
            className={`${fieldClass} resize-y min-h-[140px] leading-relaxed`}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <p className="mr-auto flex items-center gap-1.5 text-xs text-text/50 dark:text-white/40">
            <CheckCircleIcon className="h-4 w-4 text-primary/60" />
            Sent securely from your account.
          </p>
          <Button type="submit" loading={sendMessage.isPending} disabled={!message.trim()}>
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
}
