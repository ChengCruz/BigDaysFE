import { useEffect, useRef, useState } from "react";
import { MailIcon, CheckCircleIcon } from "@heroicons/react/solid";
import toast from "react-hot-toast";
import { Button } from "../../atoms/Button";
import { useAuth } from "../../../api/hooks/useAuth";
import { useUserByGuidApi } from "../../../api/hooks/useUsersApi";
import { useSendSupportMessage, type ContactType } from "../../../api/hooks/useContactApi";
import TurnstileWidget from "../../molecules/TurnstileWidget";
import { isTurnstileEnabled } from "../../../utils/turnstile";

const TYPES: { value: ContactType; label: string }[] = [
  { value: "Bug Report", label: "Bug Report" },
  { value: "Feedback", label: "Feedback" },
  { value: "Other", label: "Other" },
];

// App areas a bug can be reported against — mirrors the sidebar sections.
const MODULES = [
  "Dashboard",
  "Events",
  "RSVP Card Designer",
  "RSVP Questions",
  "RSVPs",
  "Guests",
  "Tables",
  "Floor Plan",
  "Budget",
  "Check-in",
  "Checklist",
  "Users",
  "Crew",
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
  const sendMessage = useSendSupportMessage();

  const email = user?.email ?? "";

  const [type, setType] = useState<ContactType>("Bug Report");
  const [module, setModule] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this remounts the widget to obtain a fresh single-use token after a failed submit.
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const isBug = type === "Bug Report";

  // Prefill the name once from the profile, but leave it editable afterwards.
  const namePrefilled = useRef(false);
  useEffect(() => {
    if (!namePrefilled.current && profile?.fullName) {
      setName(profile.fullName);
      namePrefilled.current = true;
    }
  }, [profile?.fullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (isBug && !module) {
      toast.error("Please select which module the bug is in.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }
    if (isTurnstileEnabled && !captchaToken) {
      toast.error("Please complete the CAPTCHA below.");
      return;
    }
    try {
      await sendMessage.mutateAsync({
        type,
        module: isBug ? module : undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        message: message.trim(),
        captchaToken: captchaToken ?? undefined,
      });
      toast.success("Thanks! Your message has been sent — we'll be in touch.");
      setMessage("");
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
    } catch {
      // Token is single-use — refresh the widget so the user can retry.
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
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
              Report a bug, share feedback, or ask us anything — we'll get back to you.
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} readOnly className={readOnlyClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>
              Phone <span className="font-normal text-text/40 dark:text-white/30">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +60 12-345 6789"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>What's this about?</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContactType)}
              className={fieldClass}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Module picker — bug reports only */}
        {isBug && (
          <div className="mt-4">
            <label className={labelClass}>Which module?</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              required
              className={fieldClass}
            >
              <option value="">— Select a module —</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className={labelClass}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder={
              isBug
                ? "Describe the bug — what you did, what you expected, and what actually happened."
                : "Share your feedback or let us know how we can help."
            }
            className={`${fieldClass} resize-y min-h-[140px] leading-relaxed`}
          />
        </div>

        {isTurnstileEnabled && (
          <div className="mt-4 flex justify-center">
            <TurnstileWidget
              key={captchaNonce}
              action="contact"
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <p className="mr-auto flex items-center gap-1.5 text-xs text-text/50 dark:text-white/40">
            <CheckCircleIcon className="h-4 w-4 text-primary/60" />
            Sent securely from your account.
          </p>
          <Button
            type="submit"
            loading={sendMessage.isPending}
            disabled={!message.trim() || !name.trim() || (isTurnstileEnabled && !captchaToken)}
          >
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
}
