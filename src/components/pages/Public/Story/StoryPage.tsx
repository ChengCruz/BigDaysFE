import { useNavigate } from "react-router-dom";

const chapters = [
  {
    num: "Chapter 01",
    title: <>It started with a <em style={{ color: '#B4543A' }}>frustration.</em></>,
    paras: [
      "JC Ng went through his own wedding planning and found it unexpectedly overwhelming — not because of the celebration, but because of the tools. Spreadsheets for guests, separate apps for budgets, and no single place to see everything at once.",
    ],
  },
  {
    num: "Chapter 02",
    title: <>Built with <em style={{ color: '#B4543A' }}>purpose.</em></>,
    paras: [
      "My Big Day was born from that experience. JC led the product vision — one calm, organised platform for every detail. Cruz brought the creative direction, ensuring that every screen couples and guests touch feels as considered as the day itself.",
    ],
  },
  {
    num: "Chapter 03",
    title: <>What we still <em style={{ color: '#B4543A' }}>believe.</em></>,
    paras: [
      "We believe wedding planning should feel as good as the wedding itself. That means straightforward tools, honest design, and a platform that works as hard as you do.",
    ],
  },
];

const values = [
  { mark: "i.", title: "Simple over complex.", body: "If it takes more than a minute to learn, we redesign it. Every tool should feel obvious the first time you use it." },
  { mark: "ii.", title: "Personal over generic.", body: "Every couple is different. The platform bends to your vision — not the other way around." },
  { mark: "iii.", title: "Calm over chaotic.", body: "Planning a wedding is already stressful. Our job is to remove friction, not add it. Calm is a feature." },
  { mark: "iv.", title: "Honest over agreeable.", body: "If something doesn't work well, we say so and fix it. You deserve tools that are reliable, not tools that just look good." },
];

export default function StoryPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E', overflowX: 'hidden' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 6rem', background: '#F5EFE6', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Our Story</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: '24ch',
              margin: '0 auto 1.5rem',
            }}
          >
            A small team with <em style={{ color: '#B4543A' }}>one</em> obsession.
          </h1>
          <p style={{ color: '#7A6B5D', fontSize: '1.25rem', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.7 }}>
            Built for the couples who want their day to feel effortless — and the planners who make that possible.
          </p>
        </div>
      </section>

      {/* Story chapters */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '5rem', alignItems: 'start' }}
          className="grid-cols-1 md:grid-cols-[1fr_1.2fr]"
        >
          {/* Sticky visual */}
          <div
            style={{
              position: 'sticky',
              top: '8rem',
              aspectRatio: '3/4',
              background: 'radial-gradient(ellipse at 30% 30%, #d4a574 0%, #B4543A 60%, #5C1F1B 100%)',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(92, 31, 27, 0.2)',
            }}
            className="hidden md:block"
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
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '14rem', color: '#FAF6EF', opacity: 0.15, userSelect: 'none' }}>
                M
              </span>
            </div>
          </div>

          {/* Chapters */}
          <div>
            {chapters.map((ch, i) => (
              <div key={i} style={{ marginBottom: '4rem' }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#B4543A', marginBottom: '1rem', display: 'block' }}>
                  {ch.num}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '2rem', marginBottom: '1.25rem', lineHeight: 1.2 }}>
                  {ch.title}
                </h3>
                {ch.paras.map((p, j) => (
                  <p key={j} style={{ color: '#7A6B5D', fontSize: '1.15rem', marginBottom: '1rem', lineHeight: 1.7 }}>{p}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: '#F5EFE6', padding: '8rem 2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Our Principles</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              Four things we <em style={{ color: '#B4543A' }}>won't</em> compromise.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#EDE4D3', border: '1px solid #EDE4D3' }} className="grid-cols-1 md:grid-cols-2">
            {values.map((v, i) => (
              <div key={i} style={{ background: '#FAF6EF', padding: '3.5rem 3rem', transition: 'background 0.3s ease' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EDE4D3'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FAF6EF'}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '3rem', color: '#B4543A', lineHeight: 1, marginBottom: '1.5rem' }}>{v.mark}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.75rem', marginBottom: '1rem' }}>{v.title}</h3>
                <p style={{ color: '#7A6B5D', fontSize: '1.05rem', lineHeight: 1.7 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '2rem' }}>
            Think we might be the <em style={{ color: '#B4543A' }}>right fit?</em>
          </h2>
          <p style={{ color: '#7A6B5D', maxWidth: '32rem', margin: '0 auto 2.5rem', fontSize: '1.15rem', lineHeight: 1.7 }}>
            Start with a free account — no commitment. Create your event and see how it feels.
          </p>
          <button className="landing-btn" onClick={() => navigate('/login')}>Get Started →</button>
        </div>
      </section>

    </div>
  );
}
