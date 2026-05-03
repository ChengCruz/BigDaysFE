import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type EventItem = {
  label: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  dress: string;
  accent: string;
  icon: string;
  body: string;
};

const events: EventItem[] = [
  {
    label: "Welcome Cocktails",
    date: "Friday, July 13, 2026",
    time: "7:00 PM – 10:00 PM",
    venue: "The Lavender Terrace",
    address: "12 Rue de Provence · Avignon",
    dress: "Garden chic",
    accent: "from-rose-300/60 via-fuchsia-200/40 to-amber-200/40",
    icon: "✦",
    body: "An open-air toast under string lights. Bring your appetite for olives and lavender martinis.",
  },
  {
    label: "Ceremony",
    date: "Saturday, July 14, 2026",
    time: "4:00 PM",
    venue: "Chapelle des Cyprès",
    address: "Domaine de Saint-Claire · Provence",
    dress: "Formal · pastels welcome",
    accent: "from-violet-400/50 via-fuchsia-300/40 to-rose-200/40",
    icon: "❀",
    body: "A short, beautiful ceremony amongst the cypress trees. Vows, music, and a few happy tears.",
  },
  {
    label: "Reception & Dinner",
    date: "Saturday, July 14, 2026",
    time: "6:30 PM – 11:30 PM",
    venue: "Le Grand Olivier",
    address: "Domaine de Saint-Claire · Provence",
    dress: "Formal",
    accent: "from-amber-300/50 via-rose-200/40 to-fuchsia-200/40",
    icon: "◆",
    body: "Five-course tasting menu, live string quartet, and an after-party that won't quit until midnight.",
  },
  {
    label: "Sunday Brunch",
    date: "Sunday, July 15, 2026",
    time: "11:00 AM – 2:00 PM",
    venue: "Café A Brasileira",
    address: "Old Town Square · Avignon",
    dress: "Linen & laughter",
    accent: "from-sky-300/50 via-teal-200/40 to-amber-200/40",
    icon: "◐",
    body: "A relaxed sendoff with espresso, pastries, and one last shared toast before you head home.",
  },
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

export default function EventsPublicPage() {
  const navigate = useNavigate();
  const detailsReveal = useReveal<HTMLDivElement>();

  return (
    <div className="overflow-hidden">
      {/* ───────── HERO ───────── */}
      <section className="relative isolate noise-overlay">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fdf6ff] via-[#fff5ee] to-[#f0f9ff] dark:from-[#0a0916] dark:via-[#150a30] dark:to-[#070718]" />
        <div className="absolute -z-10 top-[-12%] left-[-10%] h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-violet-300/60 via-fuchsia-200/40 to-transparent blur-3xl animate-blob" />
        <div className="absolute -z-10 top-[10%] right-[-12%] h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-amber-200/60 via-rose-200/40 to-transparent blur-3xl animate-blob-slow" />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-violet-700 dark:text-violet-200 animate-rise">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
            A weekend in Provence · July 2026
          </div>

          <h1 className="mt-8 font-playfair text-5xl sm:text-7xl lg:text-8xl text-slate-900 dark:text-white leading-[1.05] animate-drift">
            The <em className="italic shimmer-text">three days</em>
            <br />
            we'll never forget.
          </h1>
          <p className="mt-7 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-drift" style={{ animationDelay: "0.15s" }}>
            From sunset cocktails to a slow Sunday brunch — every moment of our wedding weekend, in one
            beautifully scheduled place.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-drift" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => navigate("/rsvp")}
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white font-medium shadow-[0_20px_60px_-20px_rgba(124,92,255,0.7)] transition hover:-translate-y-0.5 animate-gradient"
            >
              <span>Reserve your seat</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <a
              href="#schedule"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-card text-slate-800 dark:text-white font-medium hover:bg-white/80 transition"
            >
              See the schedule
            </a>
          </div>
        </div>
      </section>

      {/* ───────── SCHEDULE ───────── */}
      <section
        id="schedule"
        ref={detailsReveal.ref}
        className={`relative py-24 px-6 transition-all duration-1000 ${detailsReveal.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">The schedule</p>
            <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white">
              Every <em className="italic">moment,</em> minute by minute.
            </h2>
          </div>

          <div className="mt-14 relative">
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-violet-300 dark:via-violet-700 to-transparent hidden md:block" />
            <ol className="space-y-10 md:space-y-16">
              {events.map((ev, i) => (
                <EventRow key={ev.label} ev={ev} index={i} />
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────── PRACTICAL INFO ───────── */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-white via-[#fdf6ff] to-white dark:from-[#0a0916] dark:via-[#120a30] dark:to-[#0a0916]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">Good to know</p>
            <h2 className="mt-3 font-playfair text-4xl sm:text-5xl text-slate-900 dark:text-white">
              The little <em className="italic">details.</em>
            </h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            <InfoCard
              icon="✈"
              title="Getting there"
              body="Closest airport is Marseille Provence (MRS), 45 min from the venue. We'll arrange Saturday shuttles from Avignon."
            />
            <InfoCard
              icon="❍"
              title="Where to stay"
              body="Hôtel d'Europe and Le Domaine de Saint-Claire have a special block under our names. Code: BIGDAY26."
            />
            <InfoCard
              icon="✿"
              title="Dress code"
              body="Garden formal — long dresses, light suits, sundress and tie. Provence is warm but breezy in the evening."
            />
            <InfoCard
              icon="✦"
              title="Plus-ones & kids"
              body="Plus-ones are listed on your invitation. We adore your little ones — the Sunday brunch is family-style."
            />
            <InfoCard
              icon="◆"
              title="Gifts"
              body="Your presence is the greatest gift. If you'd like to celebrate further, our honeymoon registry is linked on your RSVP page."
            />
            <InfoCard
              icon="◐"
              title="Songs & toasts"
              body="Send us your dance-floor anthem and any toast you'd like to share — we'll work it into the magic."
            />
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative py-24 px-6 isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7ed] via-[#fdf2f8] to-[#f5f3ff] dark:from-[#0a0916] dark:via-[#160a35] dark:to-[#0a0916]" />
        <div className="absolute -z-10 top-10 right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
        <div className="absolute -z-10 bottom-10 left-10 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl animate-blob-slow" />

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">RSVP by June 1</p>
          <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white leading-tight">
            Save your seat at the <em className="italic shimmer-text">altar.</em>
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
            Tell us you're coming, share song requests, and pick your dinner — all in two minutes flat.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/rsvp")}
              className="px-9 py-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white font-medium shadow-[0_20px_60px_-20px_rgba(124,92,255,0.7)] hover:-translate-y-0.5 transition animate-gradient"
            >
              Send your RSVP
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="px-9 py-4 rounded-full glass-card text-slate-800 dark:text-white font-medium hover:bg-white/80 transition"
            >
              Ask a question
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function EventRow({ ev, index }: { ev: EventItem; index: number }) {
  const r = useReveal<HTMLLIElement>();
  const isLeft = index % 2 === 0;

  return (
    <li
      ref={r.ref}
      className={`relative md:grid md:grid-cols-2 md:gap-12 items-center transition-all duration-1000 ${
        r.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Card */}
      <div className={`${isLeft ? "md:order-1" : "md:order-2"}`}>
        <div className="relative">
          <div className={`absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br ${ev.accent} blur-2xl`} />
          <article className="relative glass-card rounded-[2rem] p-7 sm:p-9">
            <div className="flex items-start gap-4">
              <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white text-xl shadow-lg shadow-fuchsia-500/30">
                {ev.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-violet-600 dark:text-violet-300">
                  Chapter {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-playfair text-3xl text-slate-900 dark:text-white">
                  {ev.label}
                </h3>
              </div>
            </div>

            <p className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed">
              {ev.body}
            </p>

            <dl className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail term="When" value={`${ev.date} · ${ev.time}`} />
              <Detail term="Where" value={ev.venue} />
              <Detail term="Address" value={ev.address} />
              <Detail term="Dress" value={ev.dress} />
            </dl>
          </article>
        </div>
      </div>

      {/* Centered timeline dot */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-4 ring-white dark:ring-slate-900 animate-pulse-ring" />
      </div>

      {/* Spacer */}
      <div className={`hidden md:block ${isLeft ? "md:order-2" : "md:order-1"}`} />
    </li>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{term}</dt>
      <dd className="mt-0.5 text-slate-800 dark:text-white truncate">{value}</dd>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="relative glass-card rounded-3xl p-6 overflow-hidden hover:-translate-y-1 transition">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-fuchsia-300/30 blur-2xl" />
      <div className="relative">
        <div className="text-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{icon}</div>
        <h3 className="mt-3 text-xl font-playfair text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
