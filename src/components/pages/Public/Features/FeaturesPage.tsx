import { useNavigate } from "react-router-dom";

const features = [
  {
    num: "01",
    category: "RSVP",
    title: <>Beautiful <em style={{ color: '#B4543A' }}>RSVP pages</em></>,
    desc: "Send guests a branded RSVP page — no logins, no apps, just one tap to respond. Track every reply in real time as it comes in.",
    points: ["Custom-designed RSVP forms", "Real-time response tracking", "Dietary & plus-one capture"],
  },
  {
    num: "02",
    category: "Seating",
    title: <>Tables & <em style={{ color: '#B4543A' }}>floor plans</em></>,
    desc: "Design your seating with a drag-and-drop floor plan. Place tables, assign guests, add décor and infrastructure, then print or share.",
    points: ["Visual drag-and-drop editor", "Auto guest-to-table assignment", "Printable seating charts"],
  },
  {
    num: "03",
    category: "Guests",
    title: <>Guest <em style={{ color: '#B4543A' }}>management</em></>,
    desc: "One source of truth for your whole list. Track invitations, responses, dietary needs, and table assignments in a single live view.",
    points: ["Live headcount & status", "Groups & households", "Import and export lists"],
  },
  {
    num: "04",
    category: "Check-In",
    title: <>QR <em style={{ color: '#B4543A' }}>check-in</em></>,
    desc: "Scan guests in at the door with QR codes. No clipboards, no confusion — just a clean, instant record of who has arrived.",
    points: ["Instant QR scanning", "Live arrival dashboard", "Guest self-service lookup"],
  },
  {
    num: "05",
    category: "Planning",
    title: <>Events & <em style={{ color: '#B4543A' }}>budgeting</em></>,
    desc: "Keep every event, vendor, and cost in one place — from the engagement party to the honeymoon. Nothing slips through the cracks.",
    points: ["Multi-event dashboard", "Budget & expense tracking", "Vendor notes & details"],
  },
  {
    num: "06",
    category: "Timeline",
    title: <>Checklists & <em style={{ color: '#B4543A' }}>timelines</em></>,
    desc: "Stay ahead of every deadline with a guided checklist and timeline builder that keeps the whole day running to plan.",
    points: ["Guided planning checklist", "Day-of timeline builder", "Progress at a glance"],
  },
];

const stats = [
  { value: "1", label: "Platform for everything" },
  { value: "0", label: "Guest logins required" },
  { value: "24/7", label: "Real-time updates" },
];

// Real product screenshots — captured from the live app (see tests/showcase-capture.spec.ts)
const showcase = [
  {
    category: "RSVP Designer",
    img: "/showcase/rsvp.png",
    alt: "The RSVP designer building a branded wedding invite with a live phone preview",
    title: <>Design a <em style={{ color: '#B4543A' }}>stunning RSVP page</em></>,
    desc: "Drag blocks, pick a theme, drop in a countdown — build a branded invite that looks custom-made. Guests reply in one tap, no login required.",
    points: ["Live drag-and-drop canvas", "Countdown, maps & event details", "Share one link — replies land instantly"],
  },
  {
    category: "Seating & Floor Plan",
    img: "/showcase/floorplan.png",
    alt: "The visual floor plan editor with round tables, a stage, dance floor and guest assignment panel",
    title: <>Plan every seat, <em style={{ color: '#B4543A' }}>visually</em></>,
    desc: "Lay out your room exactly as it will be on the day — tables, stage, dance floor and all. Assign guests by dragging them straight into place.",
    points: ["Round, long & square tables", "Add a stage, dance floor & décor", "Drag guests onto their tables"],
  },
  {
    category: "Budget & Wallet",
    img: "/showcase/wallet.png",
    alt: "The wallet dashboard showing total budget, spending by category and a transaction history",
    title: <>Keep the budget <em style={{ color: '#B4543A' }}>under control</em></>,
    desc: "See where every ringgit goes at a glance. Track spending by category, flag pending payments, and never blow past your budget.",
    points: ["Live budget vs. spend", "Spending broken down by category", "Payment status on every expense"],
  },
  {
    category: "Guest Management",
    img: "/showcase/guests.png",
    alt: "The guest list showing guest cards with headcount, table seating and RSVP status",
    title: <>Your whole guest list, <em style={{ color: '#B4543A' }}>organised</em></>,
    desc: "One live view of everyone — headcount, table, dietary notes and RSVP status. Reach any guest on WhatsApp in a single tap.",
    points: ["Live headcount & seating status", "Groups, VIPs & dietary notes", "One-tap WhatsApp & QR check-in"],
  },
];

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E', overflowX: 'hidden' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 6rem', background: '#F5EFE6', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>What We Offer</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: '20ch',
              margin: '0 auto 1.5rem',
            }}
          >
            Every tool for your <em style={{ color: '#B4543A' }}>big day.</em>
          </h1>
          <p style={{ color: '#6B5D50', fontSize: '1.25rem', maxWidth: '38rem', margin: '0 auto', lineHeight: 1.7 }}>
            From the first RSVP to the final dance — one calm, organised platform that handles the details so you can focus on the moments.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
            className="grid-cols-1 md:grid-cols-3"
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#F5EFE6',
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
                <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', color: '#B4543A', marginBottom: '1.5rem' }}>
                  {f.num} / {f.category}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.75rem', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                  {f.title}
                </h3>
                <p style={{ color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                  {f.desc}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {f.points.map((p, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#2A221E', fontSize: '0.95rem', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                      <span style={{ color: '#B4543A', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>✦</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature showcase — real product screenshots */}
      <section style={{ background: '#F5EFE6', padding: '8rem 2.5rem', borderTop: '1px solid #EDE4D3' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>See It In Action</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '22ch', margin: '0 auto' }}>
              A real look at the <em style={{ color: '#B4543A' }}>tools you'll use.</em>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7rem' }}>
            {showcase.map((s, i) => (
              <div
                key={i}
                className="grid md:grid-cols-2 items-center"
                style={{ gap: '3.5rem' }}
              >
                {/* Screenshot (framed like an app window) */}
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <div
                    style={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '1px solid #EDE4D3',
                      boxShadow: '0 30px 60px rgba(92, 31, 27, 0.14)',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1rem', background: '#FAF6EF', borderBottom: '1px solid #EDE4D3' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#D98C7A' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E0C48A' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#B7CBB0' }} />
                    </div>
                    <img src={s.img} alt={s.alt} loading="lazy" width={1440} height={900} style={{ width: '100%', height: 'auto', aspectRatio: '1440 / 900', display: 'block' }} />
                  </div>
                </div>

                {/* Copy */}
                <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B4543A', marginBottom: '1.25rem' }}>
                    {s.category}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ color: '#6B5D50', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                    {s.desc}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {s.points.map((p, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#2A221E', fontSize: '1rem', marginBottom: '0.7rem', lineHeight: 1.5 }}>
                        <span style={{ color: '#B4543A', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>✦</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section style={{ background: '#2A221E', padding: '6rem 2.5rem' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'center' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '2rem',
                borderTop: '2px solid #B4543A',
                borderRight: i < stats.length - 1 ? '1px solid rgba(250, 246, 239, 0.08)' : 'none',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '4rem', color: '#B4543A', lineHeight: 1, marginBottom: '1rem' }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250, 246, 239, 0.6)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#F5EFE6', padding: '8rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Next Steps</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '40rem', margin: '0 auto 2rem' }}>
            See it all come <em style={{ color: '#B4543A' }}>together.</em>
          </h2>
          <p style={{ color: '#6B5D50', maxWidth: '32rem', margin: '0 auto 2.5rem', fontSize: '1.2rem', lineHeight: 1.7 }}>
            Create a free account and set up your first event in minutes — no commitment, no credit card.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="landing-btn" onClick={() => navigate('/login')}>Get Started →</button>
          </div>
        </div>
      </section>

    </div>
  );
}
