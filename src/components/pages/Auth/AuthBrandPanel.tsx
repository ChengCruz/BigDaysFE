// src/components/pages/Auth/AuthBrandPanel.tsx
// Shared branded left panel for the auth pages (/login and /crew-login).
// Purely presentational — keeps the two pages visually consistent.
import { Link } from "react-router-dom";

export default function AuthBrandPanel() {
  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #FBF7F0 0%, #F3E9DC 55%, #EADBC6 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="justify-start md:justify-between gap-8 md:gap-0 px-6 py-8 md:p-12"
    >
      {/* Botanical overlay — gold line art on cream */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 800"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
        aria-hidden
      >
        <g fill="none" stroke="#A9895A" strokeWidth="1.2">
          <path d="M150 780 Q160 600 180 450 Q200 280 190 120" />
          <path d="M175 520 Q140 500 115 470" />
          <path d="M180 470 Q215 450 240 420" />
          <path d="M175 400 Q145 385 120 355" />
          <path d="M180 350 Q215 330 240 300" />
          <ellipse cx="115" cy="470" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
          <ellipse cx="240" cy="420" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
          <ellipse cx="120" cy="355" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
          <ellipse cx="240" cy="300" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
          <path d="M450 780 Q445 650 460 530 Q475 410 470 270" />
          <path d="M460 580 Q495 560 520 530" />
          <path d="M455 500 Q420 485 395 455" />
          <ellipse cx="520" cy="530" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
          <ellipse cx="395" cy="455" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
        </g>
      </svg>

      {/* Top: brand mark — latest logo, sits naturally on the cream surface */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Link to="/" aria-label="Go to homepage" style={{ display: 'inline-block' }}>
          <img
            src="/MYBigDay_logo_trimmed.png"
            alt="My Big Day"
            width={1399}
            height={1486}
            className="block w-auto h-28 md:h-[168px]"
          />
        </Link>
      </div>

      {/* Middle: headline */}
      <div style={{ position: 'relative', zIndex: 2, color: '#2A221E' }}>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#A9895A', marginBottom: '1.5rem' }}>
          Client Portal
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            lineHeight: 1.1,
            marginBottom: '2rem',
            color: '#2A221E',
            letterSpacing: '-0.02em',
          }}
        >
          Your planning,<br />all in{" "}
          <em style={{ fontStyle: 'italic', color: '#B4543A' }}>one place.</em>
        </h2>
        <p className="hidden md:block" style={{ color: '#6B5D50', fontSize: '1.1rem', maxWidth: '28rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
          Access your events, guest lists, seating charts, and RSVP responses — everything built together, whenever you need it.
        </p>
      </div>

      {/* Bottom */}
      <div
        className="hidden md:flex"
        style={{
          position: 'relative',
          zIndex: 2,
          justifyContent: 'space-between',
          fontFamily: 'var(--font-label)',
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#6B5D50',
        }}
      >
        <span>Planned with love</span>
      </div>
    </div>
  );
}
