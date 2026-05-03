import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Countdown = { days: string; hours: string; minutes: string; seconds: string };

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCountdown(target: string): Countdown {
  const targetMs = new Date(target).getTime();
  const diff = Math.max(targetMs - Date.now(), 0);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

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

const heroSparkles = Array.from({ length: 18 });

export default function LandingPage() {
  const navigate = useNavigate();
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return formatDateInput(d);
  }, []);

  const [targetDate, setTargetDate] = useState<string>(defaultDate);
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(defaultDate));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const circles: { label: keyof Countdown; value: string }[] = [
    { label: "days", value: countdown.days },
    { label: "hours", value: countdown.hours },
    { label: "minutes", value: countdown.minutes },
    { label: "seconds", value: countdown.seconds },
  ];

  const featuresReveal = useReveal<HTMLDivElement>();
  const journeyReveal = useReveal<HTMLDivElement>();
  const testimonialReveal = useReveal<HTMLDivElement>();
  const ctaReveal = useReveal<HTMLDivElement>();

  return (
    <div className="overflow-hidden">
      {/* ───────── HERO ───────── */}
      <section className="relative isolate noise-overlay">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fdf6ff] via-[#f5ecff] to-[#fff4f0] dark:from-[#0e0a23] dark:via-[#1b1242] dark:to-[#0a0916]" />
        <div className="absolute -z-10 top-[-10%] left-[-12%] h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-fuchsia-300/60 via-violet-300/40 to-transparent blur-3xl animate-blob" />
        <div className="absolute -z-10 top-[20%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-rose-300/50 via-amber-200/40 to-transparent blur-3xl animate-blob-slow" />
        <div className="absolute -z-10 bottom-[-20%] left-[20%] h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-sky-300/40 via-teal-200/30 to-transparent blur-3xl animate-blob" />

        {heroSparkles.map((_, i) => (
          <span
            key={i}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
            style={{
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
              animation: `blob-float ${8 + (i % 6) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.6,
            }}
          />
        ))}

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 lg:pt-32 lg:pb-40 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 glass-card px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-violet-700 dark:text-violet-200 animate-rise">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
            The next generation of wedding planning
          </div>

          <h1 className="mt-8 font-playfair text-5xl sm:text-6xl lg:text-8xl leading-[1.05] text-slate-900 dark:text-white animate-drift">
            Every <em className="italic shimmer-text">love story</em>
            <br />
            deserves its own
            <span className="relative inline-block ml-3">
              <span className="relative z-10 italic">universe.</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-fuchsia-300/70 via-violet-300/70 to-amber-200/70 -z-0 rounded-full" />
            </span>
          </h1>

          <p className="mt-7 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-drift" style={{ animationDelay: "0.15s" }}>
            Craft cinematic invitations, choreograph seating to the seat, and watch RSVPs roll in
            with real-time analytics — all from one beautifully obsessive workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-drift" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => navigate("/app/events?new=1")}
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white font-medium shadow-[0_20px_60px_-20px_rgba(124,92,255,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_80px_-20px_rgba(124,92,255,0.9)] animate-gradient"
            >
              <span>Begin your story</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={() => navigate("/app/events?demo=1")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-card text-slate-800 dark:text-white font-medium hover:bg-white/80 transition"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Explore live demo
            </button>
          </div>

          {/* Floating preview */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-drift" style={{ animationDelay: "0.45s" }}>
            <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-400/40 via-violet-400/40 to-amber-300/40 blur-2xl rounded-[2.5rem]" />
            <div className="relative glass-card rounded-3xl p-2 sm:p-3">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-8 sm:p-12 text-left text-slate-100 overflow-hidden relative">
                <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="relative grid sm:grid-cols-3 gap-6">
                  {[
                    { k: "Confirmed", v: "184", trend: "+12 today" },
                    { k: "Plus-ones", v: "47", trend: "all set" },
                    { k: "Tables planned", v: "23 / 25", trend: "almost full" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur">
                      <div className="text-xs uppercase tracking-widest text-violet-200/80">{s.k}</div>
                      <div className="mt-2 font-playfair text-4xl text-white">{s.v}</div>
                      <div className="mt-1 text-xs text-emerald-300/90">{s.trend}</div>
                    </div>
                  ))}
                </div>
                <div className="relative mt-8 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 relative">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer-line_2.4s_linear_infinite]" />
                  </div>
                </div>
                <div className="relative mt-3 flex justify-between text-xs text-violet-200/70">
                  <span>Invited 240</span>
                  <span>Goal 250</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted-by marquee */}
        <div className="relative border-y border-white/40 dark:border-white/5 backdrop-blur-sm bg-white/30 dark:bg-black/20 py-6 overflow-hidden">
          <div className="text-center text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400 mb-4">
            Loved by couples & planners around the world
          </div>
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-14 pr-14 font-playfair italic text-2xl text-slate-500 dark:text-slate-400">
                <span>Vogue Brides</span><span>·</span>
                <span>Martha Stewart</span><span>·</span>
                <span>The Knot</span><span>·</span>
                <span>Junebug Weddings</span><span>·</span>
                <span>Brides.com</span><span>·</span>
                <span>Style Me Pretty</span><span>·</span>
                <span>Green Wedding Shoes</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── COUNTDOWN ───────── */}
      <section className="relative py-28 px-6 bg-gradient-to-b from-[#fffaf0] via-white to-[#fdf6ff] dark:from-[#0a0916] dark:via-[#0f0a25] dark:to-[#120832]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">Save the date</p>
          <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white">
            <em className="italic">Until forever</em> begins
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Pick a date and watch the universe count down with you.</p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full glass-card px-5 py-3">
            <label htmlFor="wedding-date" className="text-xs uppercase tracking-widest text-slate-500">Your day</label>
            <input
              id="wedding-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
            {circles.map(({ label, value }, i) => (
              <div
                key={label}
                className="group relative rounded-3xl glass-card p-7 transition hover:-translate-y-1 hover:shadow-2xl"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/0 via-fuchsia-500/0 to-amber-300/0 group-hover:from-violet-500/10 group-hover:via-fuchsia-500/10 group-hover:to-amber-300/10 transition" />
                <div className="relative">
                  <div className="font-playfair text-6xl sm:text-7xl bg-gradient-to-br from-slate-900 via-violet-700 to-fuchsia-600 dark:from-white dark:via-violet-200 dark:to-fuchsia-200 bg-clip-text text-transparent tabular-nums">
                    {value}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FEATURES BENTO ───────── */}
      <section
        ref={featuresReveal.ref}
        className={`relative py-28 px-6 transition-all duration-1000 ${featuresReveal.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">A planning suite</p>
            <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white">
              Built for the <em className="italic">unforgettable.</em>
            </h2>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
              Every detail — from the first hand-lettered invite to the last toast — orchestrated in one elegant studio.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-6 gap-5">
            {/* Big feature */}
            <div className="lg:col-span-4 lg:row-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-10 text-white min-h-[26rem]">
              <div className="absolute inset-0 noise-overlay" />
              <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-blob" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-amber-300/30 blur-2xl animate-blob-slow" />
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.4em] text-white/70">Designer studio</div>
                <h3 className="mt-3 font-playfair text-4xl sm:text-5xl leading-tight">
                  Cinematic invitations,
                  <br />
                  <em className="italic">crafted in moments.</em>
                </h3>
                <p className="mt-4 max-w-lg text-white/85">
                  Drag, drop, and dream. Pick from 40+ couture templates, layer typography like a magazine, and send to every device with a single tap.
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["#fde68a", "#fbcfe8", "#c7d2fe", "#a5f3fc"].map((c, i) => (
                      <div key={i} className="h-9 w-9 rounded-full border-2 border-white" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="text-sm text-white/90">12,400 couples planning right now</div>
                </div>
              </div>
              {/* Floating mini cards */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
                <div className="glass-card rounded-2xl p-4 w-56 rotate-6 animate-blob-slow">
                  <div className="text-xs text-slate-500">Live preview</div>
                  <div className="font-playfair italic text-xl text-slate-800">Camille &amp; Théo</div>
                  <div className="text-xs text-slate-500">07 · 14 · 2026 · Provence</div>
                </div>
              </div>
            </div>

            <FeatureTile
              icon="◐"
              eyebrow="Smart RSVPs"
              title="Replies, in real time."
              body="Auto-nudge guests, capture dietary needs, watch the funnel fill live."
              tone="violet"
            />
            <FeatureTile
              icon="◇"
              eyebrow="Seating planner"
              title="Drag, snap, delight."
              body="A floor-plan canvas that thinks like a planner — and forgives like one."
              tone="rose"
            />
            <FeatureTile
              icon="✦"
              eyebrow="Crew roles"
              title="Invite your village."
              body="Maids of honor, planners, parents — share roles without losing control."
              tone="amber"
            />
            <FeatureTile
              icon="❍"
              eyebrow="Wallet"
              title="Budget without dread."
              body="Track every spend in elegant ledgers with friendly forecasting."
              tone="teal"
            />
          </div>
        </div>
      </section>

      {/* ───────── JOURNEY TIMELINE ───────── */}
      <section
        ref={journeyReveal.ref}
        className={`relative py-28 px-6 bg-gradient-to-b from-white via-[#faf5ff] to-white dark:from-[#0a0916] dark:via-[#120a30] dark:to-[#0a0916] transition-all duration-1000 ${journeyReveal.shown ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">From spark to sparkle</p>
            <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white">
              Your <em className="italic">six-month</em> journey
            </h2>
          </div>

          <div className="mt-16 relative">
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-violet-300 to-transparent hidden md:block" />
            <div className="space-y-10 md:space-y-16">
              {[
                { step: "01", title: "Set the scene", body: "Create your event, choose a palette, pick your hero photograph.", side: "left" },
                { step: "02", title: "Invite the world", body: "Build your guest list, design your invite, send with a single click.", side: "right" },
                { step: "03", title: "Watch the magic unfold", body: "RSVPs land in real time. Plus-ones, songs, dietary notes — all captured.", side: "left" },
                { step: "04", title: "Choreograph the day", body: "Snap guests onto tables, draft the timeline, brief your crew.", side: "right" },
                { step: "05", title: "Celebrate. Breathe.", body: "Check-in by QR. Memories captured. Onward to forever.", side: "left" },
              ].map((s) => (
                <div key={s.step} className="md:grid md:grid-cols-3 md:gap-8 items-center">
                  {s.side === "left" ? (
                    <>
                      <div className="md:col-span-1">
                        <TimelineCard step={s.step} title={s.title} body={s.body} />
                      </div>
                      <div className="hidden md:flex justify-center">
                        <span className="h-4 w-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse-ring" />
                      </div>
                      <div className="hidden md:block" />
                    </>
                  ) : (
                    <>
                      <div className="hidden md:block" />
                      <div className="hidden md:flex justify-center">
                        <span className="h-4 w-4 rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 animate-pulse-ring" />
                      </div>
                      <div className="md:col-span-1">
                        <TimelineCard step={s.step} title={s.title} body={s.body} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── TESTIMONIALS ───────── */}
      <section
        ref={testimonialReveal.ref}
        className={`relative py-28 px-6 transition-all duration-1000 ${testimonialReveal.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">Loved out loud</p>
            <h2 className="mt-3 font-playfair text-5xl sm:text-6xl text-slate-900 dark:text-white">
              Words from <em className="italic">our couples.</em>
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                q: "Felt like having a creative director, planner, and best friend rolled into one app. Our wedding looked editorial.",
                n: "Aurora & James",
                w: "Lake Como, 2025",
                a: "https://i.pravatar.cc/120?img=47",
              },
              {
                q: "The seating planner alone saved my mother three meltdowns. Worth every penny times ten.",
                n: "Priya & Sam",
                w: "Udaipur, 2025",
                a: "https://i.pravatar.cc/120?img=32",
              },
              {
                q: "We tracked 320 RSVPs without a single spreadsheet. The dashboard is borderline addictive.",
                n: "Noah & Hugo",
                w: "Brooklyn, 2026",
                a: "https://i.pravatar.cc/120?img=12",
              },
            ].map((t) => (
              <figure key={t.n} className="glass-card rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-6 font-playfair italic text-7xl text-violet-200/60 leading-none select-none">”</div>
                <blockquote className="relative font-playfair text-xl text-slate-800 dark:text-white leading-relaxed">
                  {t.q}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <img src={t.a} alt="" className="h-11 w-11 rounded-full ring-2 ring-violet-200" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{t.n}</div>
                    <div className="text-xs text-slate-500">{t.w}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── STATS STRIP ───────── */}
      <section className="relative py-20 px-6 bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl animate-blob-slow" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { v: "120K+", l: "couples on cloud nine" },
            { v: "4.9★", l: "average couple rating" },
            { v: "32M", l: "guests welcomed" },
            { v: "94%", l: "say zero pre-day stress" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-playfair text-5xl sm:text-6xl bg-gradient-to-r from-fuchsia-300 via-violet-200 to-amber-200 bg-clip-text text-transparent">{s.v}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.3em] text-violet-200/80">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section
        ref={ctaReveal.ref}
        className={`relative py-32 px-6 transition-all duration-1000 ${ctaReveal.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7ed] via-[#fdf2f8] to-[#f5f3ff] dark:from-[#0a0916] dark:via-[#160a35] dark:to-[#0a0916]" />
        <div className="absolute -z-10 top-10 right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
        <div className="absolute -z-10 bottom-10 left-10 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl animate-blob-slow" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="font-playfair text-5xl sm:text-7xl text-slate-900 dark:text-white leading-tight">
            Your <em className="italic shimmer-text">forever</em> deserves
            <br />
            an opening night.
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Start free. Invite together. Celebrate your way. We promise not to send another spreadsheet your way again.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/app/events?new=1")}
              className="px-9 py-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white font-medium shadow-[0_20px_60px_-20px_rgba(124,92,255,0.7)] hover:-translate-y-0.5 transition animate-gradient"
            >
              Begin your story — it's free
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="px-9 py-4 rounded-full glass-card text-slate-800 dark:text-white font-medium hover:bg-white/80 transition"
            >
              Talk to a planner
            </button>
          </div>
          <p className="mt-6 text-xs uppercase tracking-widest text-slate-500">No credit card · Cancel anytime · Made with love</p>
        </div>
      </section>
    </div>
  );
}

function TimelineCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="glass-card rounded-3xl p-7 relative overflow-hidden hover:-translate-y-1 transition">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-fuchsia-300/30 blur-2xl" />
      <div className="relative">
        <div className="font-playfair italic text-5xl bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{step}</div>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{body}</p>
      </div>
    </div>
  );
}

function FeatureTile({
  icon, eyebrow, title, body, tone,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  tone: "violet" | "rose" | "amber" | "teal";
}) {
  const tones = {
    violet: "from-violet-100 via-fuchsia-50 to-white text-violet-700",
    rose:   "from-rose-100 via-pink-50 to-white text-rose-700",
    amber:  "from-amber-100 via-orange-50 to-white text-amber-700",
    teal:   "from-teal-100 via-sky-50 to-white text-teal-700",
  } as const;

  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${tones[tone]} dark:from-white/5 dark:via-white/0 dark:to-white/5 p-7 min-h-[12rem] hover:-translate-y-1 transition`}>
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
      <div className="relative">
        <div className="text-3xl">{icon}</div>
        <div className="mt-3 text-xs uppercase tracking-[0.3em] opacity-70">{eyebrow}</div>
        <h3 className="mt-1 text-2xl font-playfair text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{body}</p>
      </div>
    </div>
  );
}
