import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Countdown = { days: string; hours: string; minutes: string; seconds: string };

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCountdown(target: string): Countdown {
  const diff = Math.max(new Date(target).getTime() - Date.now(), 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    days:    pad(Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours:   pad(Math.floor((diff / (1000 * 60 * 60)) % 24)),
    minutes: pad(Math.floor((diff / (1000 * 60)) % 60)),
    seconds: pad(Math.floor((diff / 1000) % 60)),
  };
}

const marqueeItems = [
  "RSVP Management",
  "Guest Tracking",
  "Seating Charts",
  "Budget Planning",
  "Custom Forms",
  "QR Check-In",
  "Vendor Notes",
  "Timeline Builder",
];

const services = [
  {
    num: "01",
    category: "RSVP",
    title: <>Guest RSVPs &amp; <em>Responses</em></>,
    desc: "Create beautiful RSVP pages, track guest responses in real time, and manage dietary preferences — automatically.",
  },
  {
    num: "02",
    category: "Seating",
    title: <>Tables &amp; <em>Seating Charts</em></>,
    desc: "Design seating arrangements with an intuitive interface. Assign guests, print charts, and rearrange with ease.",
  },
  {
    num: "03",
    category: "Planning",
    title: <>Events &amp; <em>Budgeting</em></>,
    desc: "Keep every event, vendor, and budget item in one place. From engagement party to honeymoon — nothing gets lost.",
  },
];

const botanicalSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 500"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}
    aria-hidden
  >
    <g fill="none" stroke="#FAF6EF" strokeWidth="1.5" strokeLinecap="round">
      <path d="M100 480 Q110 380 130 300 Q150 220 140 120" />
      <path d="M130 340 Q100 320 80 290" />
      <path d="M135 310 Q165 295 185 270" />
      <path d="M130 260 Q105 245 85 220" />
      <path d="M135 230 Q165 215 185 190" />
      <path d="M138 180 Q115 170 95 145" />
      <path d="M300 480 Q295 400 310 330 Q325 260 320 180" />
      <path d="M310 350 Q340 335 360 310" />
      <path d="M305 290 Q280 275 260 250" />
      <path d="M312 240 Q340 225 360 200" />
      <ellipse cx="80"  cy="290" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="185" cy="270" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="85"  cy="220" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="185" cy="190" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="95"  cy="145" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="360" cy="310" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="260" cy="250" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
      <ellipse cx="360" cy="200" rx="8" ry="4" fill="#FAF6EF" opacity="0.6" />
    </g>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();

  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return formatDateInput(d);
  }, []);

  const [targetDate, setTargetDate] = useState(defaultDate);
  const [countdown, setCountdown] = useState(() => getCountdown(defaultDate));

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const countdownUnits = [
    { label: "days",    value: countdown.days },
    { label: "hrs",     value: countdown.hours },
    { label: "min",     value: countdown.minutes },
    { label: "sec",     value: countdown.seconds },
  ] as const;

  const doubled = [...marqueeItems, ...marqueeItems];

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E', overflowX: 'hidden' }}>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          padding: '10rem 2.5rem 6rem',
          display: 'flex',
          alignItems: 'center',
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(180, 84, 58, 0.12), transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 80%, rgba(107, 122, 75, 0.10), transparent 60%),
            #FAF6EF
          `,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'clamp(1fr, 1.2fr, 1.2fr) clamp(1fr, 0.8fr, 0.8fr)',
            gap: '4rem',
            alignItems: 'center',
          }}
          className="grid-cols-1 md:grid-cols-[1.2fr_0.8fr]"
        >
          {/* Left: Copy */}
          <div>
            <div className="eyebrow" style={{ marginBottom: '1.5rem', animationDelay: '0.1s' }}>
              The Wedding Planner Platform
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                fontSize: 'clamp(3rem, 8vw, 6.5rem)',
                marginBottom: '2rem',
              }}
            >
              <span style={{ display: 'block' }}>Your day,</span>
              <span style={{ display: 'block' }}>
                planned <em style={{ fontStyle: 'italic', color: '#B4543A' }}>with</em>
              </span>
              <span style={{ display: 'block', fontStyle: 'italic', color: '#B4543A' }}>intention.</span>
            </h1>
            <p
              style={{
                color: '#7A6B5D',
                fontSize: '1.25rem',
                maxWidth: '30rem',
                marginBottom: '3rem',
                lineHeight: 1.7,
              }}
            >
              From beautiful RSVP pages to seating charts and guest management — everything for your perfect day, beautifully organised in one place.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="landing-btn"
                onClick={() => navigate("/login")}
              >
                Begin Your Story →
              </button>
              <button
                className="landing-btn landing-btn-outline"
                onClick={() => navigate("/events")}
              >
                View Demo
              </button>
            </div>
          </div>

          {/* Right: Visual frame with countdown badge */}
          <div className="hidden md:block" style={{ position: 'relative', height: '540px' }}>
            {/* Gradient frame */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '260px 260px 8px 8px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #d4a574 0%, #B4543A 50%, #5C1F1B 100%)',
                boxShadow: '0 30px 80px rgba(92, 31, 27, 0.25)',
              }}
            >
              {/* Radial overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `
                    radial-gradient(circle at 30% 20%, rgba(255, 220, 180, 0.4), transparent 50%),
                    radial-gradient(circle at 70% 70%, rgba(92, 31, 27, 0.3), transparent 60%)
                  `,
                }}
              />
              {botanicalSvg}
            </div>

            {/* Countdown badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                background: '#FAF6EF',
                padding: '1.5rem 2rem',
                border: '1px solid #EDE4D3',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                zIndex: 3,
                minWidth: '260px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#7A6B5D',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <label htmlFor="wedding-date-hero">Countdown to</label>
                <input
                  id="wedding-date-hero"
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    border: 'none',
                    borderBottom: '1px solid #EDE4D3',
                    background: 'transparent',
                    color: '#7A6B5D',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                {countdownUnits.map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontSize: '2.25rem',
                        color: '#B4543A',
                        fontWeight: 300,
                        lineHeight: 1,
                        display: 'block',
                      }}
                    >
                      {value}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: '#7A6B5D',
                        display: 'block',
                        marginTop: '0.25rem',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          MARQUEE
      ══════════════════════════════ */}
      <div
        style={{
          background: '#2A221E',
          color: '#FAF6EF',
          padding: '1.5rem 0',
          overflow: 'hidden',
          borderTop: '1px solid #B4543A',
          borderBottom: '1px solid #B4543A',
        }}
      >
        <div
          className="animate-marquee"
          style={{
            display: 'flex',
            gap: '3rem',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '1.5rem',
          }}
        >
          {doubled.map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '3rem' }}>
              {item}
              <span style={{ color: '#B4543A', fontStyle: 'normal', fontSize: '1rem' }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          SERVICES
      ══════════════════════════════ */}
      <section style={{ background: '#F5EFE6', padding: '8rem 2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'end', marginBottom: '5rem' }}
            className="grid-cols-1 md:grid-cols-2"
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>What We Offer</div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                A full platform, from first{" "}
                <em style={{ fontStyle: 'italic', color: '#B4543A' }}>RSVP to final dance.</em>
              </h2>
            </div>
            <p style={{ color: '#7A6B5D', fontSize: '1.2rem', maxWidth: '32rem', lineHeight: 1.7, fontFamily: 'var(--font-serif)' }}>
              We handle every tool you need — whether you're just getting engaged or putting the finishing touches on your seating chart.
            </p>
          </div>

          {/* Cards */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
            className="grid-cols-1 md:grid-cols-3"
          >
            {services.map((s, i) => (
              <div
                key={i}
                style={{
                  background: '#FAF6EF',
                  padding: '3rem 2.5rem',
                  border: '1px solid #EDE4D3',
                  position: 'relative',
                  transition: 'all 0.4s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 60px rgba(92, 31, 27, 0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = '#B4543A';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = '#EDE4D3';
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.2em',
                    color: '#B4543A',
                    marginBottom: '1.5rem',
                  }}
                >
                  {s.num} / {s.category}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300,
                    fontSize: '1.75rem',
                    lineHeight: 1.2,
                    marginBottom: '1rem',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ color: '#7A6B5D', fontSize: '1.05rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
                  {s.desc}
                </p>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2rem',
                    right: '2.5rem',
                    width: '2rem',
                    height: '2rem',
                    border: '1px solid #2A221E',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          PHILOSOPHY
      ══════════════════════════════ */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {/* Visual panel */}
          <div
            style={{
              aspectRatio: '4/5',
              background: 'radial-gradient(ellipse at 40% 40%, #f0d5b8 0%, #d4a574 40%, #B4543A 100%)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '16rem',
                  color: '#FAF6EF',
                  opacity: 0.2,
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                M
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}
              aria-hidden
            >
              <g fill="none" stroke="#5C1F1B" strokeWidth="1">
                <circle cx="200" cy="250" r="180" />
                <circle cx="200" cy="250" r="140" />
                <circle cx="200" cy="250" r="100" />
                <circle cx="200" cy="250" r="60" />
                <path d="M200 70 L200 430 M20 250 L380 250 M70 120 L330 380 M330 120 L70 380" />
              </g>
            </svg>
          </div>

          {/* Content */}
          <div>
            <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>Our Approach</div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '2rem',
              }}
            >
              Built around your <em style={{ fontStyle: 'italic', color: '#B4543A' }}>story.</em>
            </h2>
            <p style={{ color: '#7A6B5D', fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: 1.7, fontFamily: 'var(--font-serif)' }}>
              No two weddings are alike. Our platform adapts to your vision — your guest list, your timeline, your way of doing things.
            </p>
            <p style={{ color: '#7A6B5D', fontSize: '1.2rem', marginBottom: '2.5rem', lineHeight: 1.7, fontFamily: 'var(--font-serif)' }}>
              Every tool is designed to feel effortless, so you can focus on the moments that matter, not the spreadsheets.
            </p>
            <blockquote
              style={{
                borderLeft: '2px solid #B4543A',
                paddingLeft: '2rem',
                margin: '2.5rem 0',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '1.75rem',
                lineHeight: 1.4,
                color: '#2A221E',
                fontWeight: 300,
              }}
            >
              "The most beautiful weddings are the ones that feel inevitable — as if this couple could have been organised no other way."
            </blockquote>
            <button className="landing-btn landing-btn-outline" onClick={() => navigate("/story")}>
              Read Our Story →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          TESTIMONIAL
      ══════════════════════════════ */}
      <section style={{ background: '#5C1F1B', color: '#FAF6EF', padding: '8rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            className="eyebrow"
            style={{ color: '#A9895A', justifyContent: 'center', display: 'inline-flex', marginBottom: '2.5rem' }}
          >
            Kind Words
          </div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              lineHeight: 1.3,
              maxWidth: '50rem',
              margin: '0 auto 3rem',
            }}
          >
            "We had no idea planning could feel this calm. The RSVP page was so beautiful our guests thought we'd hired a designer, and the seating chart tool saved us three arguments."
          </p>
          <div
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#A9895A',
            }}
          >
            — Sarah &amp; James · London, 2025
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CTA
      ══════════════════════════════ */}
      <section style={{ background: '#F5EFE6', padding: '8rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>
            Next Steps
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(2.25rem, 5vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: '40rem',
              margin: '0 auto 2rem',
            }}
          >
            Plan. Invite. <em style={{ fontStyle: 'italic', color: '#B4543A' }}>Celebrate.</em>
          </h2>
          <p
            style={{
              color: '#7A6B5D',
              maxWidth: '32rem',
              margin: '0 auto 2.5rem',
              fontSize: '1.2rem',
              lineHeight: 1.7,
              fontFamily: 'var(--font-serif)',
            }}
          >
            Streamline your wedding with real-time RSVP tracking, seating charts, and tools designed for the moments that matter most.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="landing-btn" onClick={() => navigate("/login")}>
              Start a New Event →
            </button>
            <button className="landing-btn landing-btn-outline" onClick={() => navigate("/events")}>
              Explore a Demo
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
