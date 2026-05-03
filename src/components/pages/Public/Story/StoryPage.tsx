import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Chapter = {
  era: string;
  date: string;
  title: string;
  body: string;
  image: string;
  accent: string;
};

const chapters: Chapter[] = [
  {
    era: "Chapter One",
    date: "Spring 2019 · Lisbon",
    title: "A coincidence at Café A Brasileira",
    body:
      "It started with a spilled espresso and a borrowed napkin. He was sketching the river; she was reading Pessoa. Two strangers, one rainy afternoon, and a conversation that didn't end until the streetlights flickered on.",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&q=80&auto=format&fit=crop",
    accent: "from-rose-300/50 via-fuchsia-200/40 to-amber-200/40",
  },
  {
    era: "Chapter Two",
    date: "Autumn 2020 · Long-distance",
    title: "Letters across two oceans",
    body:
      "Pandemic borders, polaroids in envelopes, voice notes timed to time zones. We built a whole world out of Sunday calls and screenshots of constellations from opposite hemispheres.",
    image: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=1200&q=80&auto=format&fit=crop",
    accent: "from-indigo-300/50 via-violet-300/40 to-sky-200/40",
  },
  {
    era: "Chapter Three",
    date: "Summer 2022 · Provence",
    title: "The lavender field, the question",
    body:
      "He'd memorized the speech for months. He forgot all of it. So he said the only thing left: 'Will you?' She laughed, then she cried, then the bees came, and then she said yes.",
    image: "https://images.unsplash.com/photo-1565073624497-7e91b3d8d6f7?w=1200&q=80&auto=format&fit=crop",
    accent: "from-violet-400/50 via-purple-300/40 to-fuchsia-200/40",
  },
  {
    era: "Chapter Four",
    date: "2026 · Coming home",
    title: "And then, forever begins",
    body:
      "A garden by the sea, our favorite humans, the playlist we've been building for seven years. We can't wait to dance with you under the same stars that started it all.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
    accent: "from-amber-300/50 via-rose-200/40 to-fuchsia-200/40",
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
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, shown };
}

export default function StoryPage() {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden">
      {/* ───────── HERO ───────── */}
      <section className="relative isolate noise-overlay">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#fdf6ff] via-[#fff5ee] to-white dark:from-[#0a0916] dark:via-[#150a30] dark:to-[#0a0916]" />
        <div className="absolute -z-10 top-[-10%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-fuchsia-300/60 via-rose-200/40 to-transparent blur-3xl animate-blob" />
        <div className="absolute -z-10 bottom-[-20%] left-[-10%] h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-amber-200/50 via-pink-200/40 to-transparent blur-3xl animate-blob-slow" />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-rose-700 dark:text-rose-200 animate-rise">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Our love story · est. 2019
          </div>

          <h1 className="mt-8 font-playfair text-5xl sm:text-7xl lg:text-8xl text-slate-900 dark:text-white leading-[1.05] animate-drift">
            A story written in
            <br />
            <em className="italic shimmer-text">small, perfect moments.</em>
          </h1>
          <p className="mt-7 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-drift" style={{ animationDelay: "0.15s" }}>
            Some couples meet. Others collide gently, like two pages of a book turning at the same time.
            This is ours — every chapter, every coincidence, every unplanned yes.
          </p>

          {/* Photo collage */}
          <div className="mt-16 relative h-[24rem] sm:h-[28rem] max-w-4xl mx-auto animate-drift" style={{ animationDelay: "0.3s" }}>
            <PolaroidPhoto
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop"
              caption="July 2019"
              className="absolute left-0 top-6 -rotate-6 w-44 sm:w-56"
              float
            />
            <PolaroidPhoto
              src="https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80&auto=format&fit=crop"
              caption="Spring 2021"
              className="absolute left-1/2 -translate-x-1/2 top-0 rotate-2 w-48 sm:w-64 z-10"
              float
            />
            <PolaroidPhoto
              src="https://images.unsplash.com/photo-1525772764200-be829a350797?w=600&q=80&auto=format&fit=crop"
              caption="Provence, 2022"
              className="absolute right-0 top-12 rotate-8 w-44 sm:w-56"
              float
            />
            <PolaroidPhoto
              src="https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=600&q=80&auto=format&fit=crop"
              caption="Coming soon"
              className="absolute left-10 sm:left-24 bottom-0 -rotate-3 w-40 sm:w-52"
              float
            />
            <PolaroidPhoto
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80&auto=format&fit=crop"
              caption="2026"
              className="absolute right-8 sm:right-24 bottom-2 rotate-6 w-40 sm:w-52"
              float
            />
          </div>
        </div>
      </section>

      {/* ───────── PROLOGUE QUOTE ───────── */}
      <section className="py-20 px-6">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-playfair italic text-9xl text-violet-200/70 dark:text-violet-700/40 leading-none select-none">
            “
          </div>
          <p className="relative font-playfair italic text-3xl sm:text-4xl text-slate-800 dark:text-white leading-snug">
            We met like a sentence finishes itself —
            <br className="hidden sm:block" />
            quietly, and exactly when it had to.
          </p>
          <div className="mt-6 inline-flex items-center gap-3">
            <span className="h-px w-10 bg-violet-400" />
            <span className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">A prologue</span>
            <span className="h-px w-10 bg-violet-400" />
          </div>
        </div>
      </section>

      {/* ───────── CHAPTERS ───────── */}
      <section className="relative py-12">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-violet-300 dark:via-violet-700 to-transparent hidden lg:block" />
        <div className="space-y-32 lg:space-y-44 max-w-7xl mx-auto px-6">
          {chapters.map((c, i) => (
            <ChapterCard key={c.title} chapter={c} index={i} />
          ))}
        </div>
      </section>

      {/* ───────── PLAYLIST ───────── */}
      <section className="relative py-28 px-6">
        <div className="max-w-4xl mx-auto glass-card rounded-[2.5rem] p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl animate-blob" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl animate-blob-slow" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">Soundtrack</p>
            <h2 className="mt-3 font-playfair text-4xl sm:text-5xl text-slate-900 dark:text-white">
              The songs that <em className="italic">made us.</em>
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">A playlist seven years in the making.</p>

            <ul className="mt-8 divide-y divide-violet-200/60 dark:divide-white/10">
              {[
                { n: "01", t: "Sunsetz", a: "Cigarettes After Sex", l: "3:48", note: "First dance, kitchen floor" },
                { n: "02", t: "Cherry Wine", a: "Hozier", l: "4:01", note: "Lisbon, raining" },
                { n: "03", t: "If You're Too Shy", a: "The 1975", l: "5:01", note: "Long-distance Saturdays" },
                { n: "04", t: "Lover", a: "Taylor Swift", l: "3:41", note: "The proposal song" },
                { n: "05", t: "Home", a: "Edward Sharpe", l: "5:07", note: "Walking each other home" },
              ].map((s) => (
                <li key={s.n} className="flex items-center gap-4 py-4 group">
                  <span className="font-playfair italic text-2xl text-violet-500/70 w-10">{s.n}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate">{s.t}</div>
                    <div className="text-xs text-slate-500 truncate">{s.a} · {s.note}</div>
                  </div>
                  <span className="text-xs tabular-nums text-slate-500">{s.l}</span>
                  <button className="h-9 w-9 rounded-full bg-violet-100 text-violet-700 grid place-items-center transition group-hover:bg-violet-600 group-hover:text-white">
                    ▶
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── BY THE NUMBERS ───────── */}
      <section className="relative py-24 px-6 bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-fuchsia-500/40 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl animate-blob-slow" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-200/80">Us, in numbers</p>
            <h2 className="mt-3 font-playfair text-5xl sm:text-6xl">
              <em className="italic">2,557</em> days and counting.
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {[
              { v: "12", l: "countries together" },
              { v: "47", l: "love letters mailed" },
              { v: "2", l: "rescue dogs adopted" },
              { v: "1", l: "lifetime planned" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-playfair text-6xl bg-gradient-to-r from-fuchsia-300 via-violet-200 to-amber-200 bg-clip-text text-transparent">{s.v}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.3em] text-violet-200/80">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── INVITATION CTA ───────── */}
      <section className="relative py-32 px-6 isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7ed] via-[#fdf2f8] to-[#f5f3ff] dark:from-[#0a0916] dark:via-[#160a35] dark:to-[#0a0916]" />
        <div className="absolute -z-10 top-10 right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
        <div className="absolute -z-10 bottom-10 left-10 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl animate-blob-slow" />

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-violet-600 dark:text-violet-300">The next chapter is yours</p>
          <h2 className="mt-3 font-playfair text-5xl sm:text-7xl text-slate-900 dark:text-white leading-tight">
            Will you join us at the <em className="italic shimmer-text">altar?</em>
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
            Save your seat, send a song request, and tell us what you'll be wearing — we love a little anticipation.
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
              Send a love note
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChapterCard({ chapter, index }: { chapter: Chapter; index: number }) {
  const r = useReveal<HTMLDivElement>();
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={r.ref}
      className={`relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-1000 ${
        r.shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {/* Photo */}
      <div className={`relative ${isLeft ? "lg:order-1" : "lg:order-2"}`}>
        <div className={`absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br ${chapter.accent} blur-2xl`} />
        <div className="relative rounded-[2rem] overflow-hidden glass-card p-2">
          <img
            src={chapter.image}
            alt={chapter.title}
            className="w-full h-[20rem] sm:h-[26rem] object-cover rounded-[1.5rem]"
          />
        </div>
        <div className="absolute -bottom-6 left-6 sm:left-12 glass-card rounded-2xl px-5 py-3 shadow-xl">
          <div className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-300">{chapter.era}</div>
          <div className="text-sm font-medium text-slate-700 dark:text-white">{chapter.date}</div>
        </div>
      </div>

      {/* Text */}
      <div className={`relative ${isLeft ? "lg:order-2" : "lg:order-1"}`}>
        <div className="font-playfair italic text-7xl bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent leading-none">
          {String(index + 1).padStart(2, "0")}
        </div>
        <h3 className="mt-3 font-playfair text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
          {chapter.title}
        </h3>
        <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          {chapter.body}
        </p>
        <div className="mt-7 flex items-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-violet-400 to-transparent" />
          <span className="text-xs uppercase tracking-[0.35em] text-slate-500">to be continued</span>
        </div>
      </div>

      {/* Centered timeline dot */}
      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-4 ring-white dark:ring-slate-900 animate-pulse-ring" />
      </div>
    </div>
  );
}

function PolaroidPhoto({
  src, caption, className = "", float = false,
}: {
  src: string;
  caption: string;
  className?: string;
  float?: boolean;
}) {
  return (
    <figure
      className={`relative bg-white dark:bg-slate-100 p-3 pb-8 rounded-md shadow-2xl ${className} ${float ? "animate-blob-slow" : ""}`}
      style={float ? { animationDuration: `${10 + (caption.length % 5) * 2}s` } : undefined}
    >
      <img src={src} alt={caption} className="w-full h-40 sm:h-48 object-cover rounded-sm" />
      <figcaption className="mt-2 text-center font-playfair italic text-xs text-slate-600">
        {caption}
      </figcaption>
    </figure>
  );
}
