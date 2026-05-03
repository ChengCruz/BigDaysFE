import { useEffect, useRef, useState } from "react";
import MailIcon from "@heroicons/react/outline/MailIcon";
import PhoneIcon from "@heroicons/react/outline/PhoneIcon";
import LocationMarkerIcon from "@heroicons/react/outline/LocationMarkerIcon";
import ChatAlt2Icon from "@heroicons/react/outline/ChatAlt2Icon";
import CalendarIcon from "@heroicons/react/outline/CalendarIcon";
import SparklesIcon from "@heroicons/react/outline/SparklesIcon";

type FormState = {
  name: string;
  email: string;
  topic: string;
  guests: string;
  message: string;
  date: string;
};

const topics = [
  { id: "rsvp",    label: "I'm a guest, RSVP help",       icon: "🌿" },
  { id: "demo",    label: "Book a planner demo",          icon: "✨" },
  { id: "press",   label: "Press & collaborations",       icon: "📰" },
  { id: "partner", label: "Vendor partnerships",          icon: "🎀" },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShown(true),
      { threshold: 0.18 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, shown };
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "", email: "", topic: "demo", guests: "", message: "", date: "",
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const detailsReveal = useReveal<HTMLDivElement>();
  const faqReveal = useReveal<HTMLDivElement>();

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 900);
  }

  return (
    <div className="overflow-hidden">
      {/* ───────── HERO ───────── */}
      <section className="relative isolate noise-overlay">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fdf6ff] via-[#fff5ee] to-[#f0f9ff] dark:from-[#0a0916] dark:via-[#150a30] dark:to-[#070718]" />
        <div className="absolute -z-10 top-[-15%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-violet-300/60 via-fuchsia-200/40 to-transparent blur-3xl animate-blob" />
        <div className="absolute -z-10 top-[10%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-amber-200/60 via-rose-200/40 to-transparent blur-3xl animate-blob-slow" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-violet-700 dark:text-violet-200 animate-rise">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            Replies within 24 hours
          </div>

          <h1 className="mt-8 font-playfair text-5xl sm:text-7xl lg:text-8xl text-slate-900 dark:text-white leading-[1.05] animate-drift">
            Let's start a
            <br />
            <em className="italic shimmer-text">beautiful conversation.</em>
          </h1>
          <p className="mt-7 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-drift" style={{ animationDelay: "0.15s" }}>
            Whether you're saying yes to a seat, asking about a service, or just want to share a song
            request — we read every word, with very good coffee in hand.
          </p>
        </div>
      </section>

      {/* ───────── CHANNELS STRIP ───────── */}
      <section className="relative -mt-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <ChannelCard
            icon={<MailIcon className="h-6 w-6" />}
            label="Write to us"
            value="hello@mybigday.app"
            tone="violet"
            href="mailto:hello@mybigday.app"
          />
          <ChannelCard
            icon={<PhoneIcon className="h-6 w-6" />}
            label="Call our concierge"
            value="+1 (415) 555 · 0188"
            tone="rose"
            href="tel:+14155550188"
          />
          <ChannelCard
            icon={<ChatAlt2Icon className="h-6 w-6" />}
            label="Live chat"
            value="Mon–Sat · 9am – 9pm PT"
            tone="amber"
          />
        </div>
      </section>

      {/* ───────── FORM + ASIDE ───────── */}
      <section
        ref={detailsReveal.ref}
        className={`relative py-24 px-6 transition-all duration-1000 ${detailsReveal.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-10">
          {/* FORM */}
          <div className="lg:col-span-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-violet-300/40 via-fuchsia-200/40 to-amber-200/40 blur-2xl" />
              <form
                onSubmit={submit}
                className="relative glass-card rounded-[2.5rem] p-8 sm:p-12 space-y-7"
              >
                <header>
                  <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">Send us a note</p>
                  <h2 className="mt-2 font-playfair text-3xl sm:text-4xl text-slate-900 dark:text-white">
                    Tell us about your <em className="italic">big day.</em>
                  </h2>
                </header>

                {/* Topic chips */}
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update("topic", t.id)}
                      className={`px-4 py-2 rounded-full border text-sm transition ${
                        form.topic === t.id
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-md"
                          : "bg-white/70 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-300"
                      }`}
                    >
                      <span className="mr-1.5">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <FloatingField label="Your name" value={form.name} onChange={(v) => update("name", v)} required />
                  <FloatingField label="Email address" type="email" value={form.email} onChange={(v) => update("email", v)} required />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <FloatingField
                    label="Estimated guest count"
                    value={form.guests}
                    onChange={(v) => update("guests", v)}
                  />
                  <FloatingField
                    label="Dream date (optional)"
                    type="date"
                    value={form.date}
                    onChange={(v) => update("date", v)}
                  />
                </div>

                <FloatingField
                  label="Tell us your story (or your question)"
                  multiline
                  value={form.message}
                  onChange={(v) => update("message", v)}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-slate-500">
                    By sending you agree to our gentle <span className="underline">privacy promise</span>.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || sent}
                    className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white font-medium shadow-[0_15px_45px_-15px_rgba(124,92,255,0.7)] hover:-translate-y-0.5 transition disabled:opacity-70 disabled:translate-y-0 animate-gradient"
                  >
                    {sent ? (
                      <>
                        <SparklesIcon className="h-5 w-5" /> Message on its way
                      </>
                    ) : submitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send message
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </button>
                </div>

                {sent && (
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-5 py-4 text-sm flex items-center gap-2 animate-rise">
                    <SparklesIcon className="h-5 w-5" />
                    Thank you! Your note is in good hands — expect a reply within one business day.
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ASIDE */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-[2rem] p-7 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-fuchsia-300/40 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white">
                    <LocationMarkerIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Studio</p>
                    <p className="font-medium text-slate-900 dark:text-white">San Francisco · Lisbon · Tokyo</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl overflow-hidden h-44 relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  {/* Stylized "map" */}
                  <div className="absolute inset-0 opacity-70" style={{
                    backgroundImage: "radial-gradient(circle at 20% 30%, rgba(167,139,250,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(244,114,182,0.4), transparent 40%), linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                  }} />
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(124,92,255,0.15)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <path d="M 0 100 Q 80 40 160 90 T 320 80 T 480 100" stroke="rgba(124,92,255,0.45)" strokeWidth="2" fill="none" />
                  </svg>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="block h-4 w-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse-ring" />
                  </div>
                  <div className="absolute bottom-3 left-3 glass-card rounded-xl px-3 py-2 text-xs">
                    <span className="font-medium text-slate-800">HQ ·</span>{" "}
                    <span className="text-slate-600">355 Fillmore St, SF</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-7 relative overflow-hidden">
              <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-amber-300/40 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 grid place-items-center text-white">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Concierge hours</p>
                    <p className="font-medium text-slate-900 dark:text-white">Real humans, friendly hours</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {[
                    ["Monday – Friday", "9:00 — 21:00"],
                    ["Saturday", "10:00 — 18:00"],
                    ["Sunday", "by appointment"],
                  ].map(([d, h]) => (
                    <li key={d} className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 pb-2 last:border-0">
                      <span>{d}</span>
                      <span className="tabular-nums text-slate-500">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-7 relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 text-white">
              <div className="absolute inset-0 noise-overlay" />
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/30 blur-2xl animate-blob" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">Social</p>
                <h3 className="mt-2 font-playfair text-2xl">Follow our every <em className="italic">moment.</em></h3>
                <p className="mt-2 text-sm text-white/85">Behind-the-scenes, mood boards, and real couples on Saturdays.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Instagram", "TikTok", "Pinterest", "YouTube"].map((s) => (
                    <a key={s} href="#" className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-sm">
                      {s}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section
        ref={faqReveal.ref}
        className={`relative py-24 px-6 bg-gradient-to-b from-white via-[#fdf6ff] to-white dark:from-[#0a0916] dark:via-[#120a30] dark:to-[#0a0916] transition-all duration-1000 ${faqReveal.shown ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">Quick answers</p>
            <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white">
              Everything <em className="italic">you'd ask</em> us.
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <FAQItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── PROMISE ───────── */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-playfair italic text-3xl sm:text-4xl text-slate-700 dark:text-slate-200 leading-snug">
            “We treat every message like a wedding invitation —
            <br className="hidden sm:block" />
            with care, with curiosity, and with a real reply from a real person.”
          </p>
          <div className="mt-8 inline-flex items-center gap-3">
            <img src="https://i.pravatar.cc/80?img=20" alt="" className="h-12 w-12 rounded-full ring-2 ring-violet-200" />
            <div className="text-left">
              <div className="font-medium text-slate-900 dark:text-white">Mira Castellanos</div>
              <div className="text-xs text-slate-500">Head of Couple Care</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChannelCard({
  icon, label, value, tone, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "violet" | "rose" | "amber";
  href?: string;
}) {
  const tones = {
    violet: "from-violet-500 to-fuchsia-500",
    rose:   "from-rose-400 to-pink-500",
    amber:  "from-amber-400 to-orange-500",
  } as const;

  const Wrapper: any = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group glass-card rounded-3xl p-6 flex items-center gap-5 transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${tones[tone]} text-white grid place-items-center shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
        <div className="mt-1 font-medium text-slate-900 dark:text-white truncate group-hover:underline">{value}</div>
      </div>
    </Wrapper>
  );
}

function FloatingField({
  label, value, onChange, type = "text", multiline, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const has = value.length > 0;
  const Input: any = multiline ? "textarea" : "input";

  return (
    <label className="relative block">
      <Input
        type={multiline ? undefined : type}
        value={value}
        required={required}
        onChange={(e: any) => onChange(e.target.value)}
        rows={multiline ? 4 : undefined}
        placeholder=" "
        className={`peer w-full bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl px-4 ${multiline ? "pt-6 pb-3" : "pt-6 pb-2"} text-slate-900 dark:text-white outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-200/50`}
      />
      <span
        className={`pointer-events-none absolute left-4 transition-all text-slate-500 ${
          has || type === "date"
            ? "top-1.5 text-[10px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300"
            : "top-4 text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.2em] peer-focus:text-violet-600"
        }`}
      >
        {label}{required && " *"}
      </span>
    </label>
  );
}

const faqs = [
  {
    q: "Do you reply to every message?",
    a: "Every single one — usually within a business day, faster during European mornings. If we are busier than usual we'll send a quick acknowledgement first.",
  },
  {
    q: "I'm a guest with an RSVP question — same form?",
    a: "Yes! Pick the 'I'm a guest' topic above and add the couple's name. We'll route it instantly to their planner inbox.",
  },
  {
    q: "Can we book a real, human walkthrough?",
    a: "Absolutely. Choose 'Book a planner demo' and add your dream date. We'll send three calendar slots (with espresso emoji included).",
  },
  {
    q: "Do you work with vendors and venues?",
    a: "We love a good partnership. Tell us a little about your space or service and we'll get our partnerships team in touch.",
  },
  {
    q: "Is my data safe?",
    a: "Encrypted in transit and at rest. We never sell guest data. Ever. Read our privacy promise for the full, plain-English details.",
  },
];

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`glass-card rounded-2xl overflow-hidden transition ${open ? "shadow-xl" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-6 p-5 text-left"
      >
        <span className="font-playfair text-lg sm:text-xl text-slate-900 dark:text-white">{q}</span>
        <span className={`h-8 w-8 grid place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-slate-600 dark:text-slate-300 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}
