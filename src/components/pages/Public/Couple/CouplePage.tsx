import { useNavigate } from "react-router-dom";

export default function CouplePage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 6rem', background: '#F5EFE6', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>The Couple</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '24ch', margin: '0 auto 1.5rem' }}>
            Two people, one <em style={{ color: '#B4543A' }}>perfect day.</em>
          </h1>
          <p style={{ color: '#7A6B5D', fontSize: '1.25rem', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.7 }}>
            Every wedding begins with a story. This is yours to tell.
          </p>
        </div>
      </section>

      {/* Couple layout */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4rem', alignItems: 'start' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {/* Partner A */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg, #EDE4D3, #B4543A)', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '8rem', color: '#FAF6EF', opacity: 0.9, userSelect: 'none' }}>
                A
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.75rem', marginBottom: '0.5rem' }}>The Bride</h3>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B4543A', marginBottom: '1rem' }}>Partner One</div>
            <p style={{ color: '#7A6B5D', fontSize: '1.05rem', lineHeight: 1.7 }}>
              [Her story goes here — how you met, what she loves, what makes her laugh. The details that make her entirely herself.]
            </p>
          </div>

          {/* Centre divider */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', paddingTop: '4rem' }}>
            <div style={{ width: '1px', height: '80px', background: '#EDE4D3' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '3rem', color: '#B4543A', fontWeight: 300 }}>&amp;</div>
            <div style={{ width: '1px', height: '80px', background: '#EDE4D3' }} />
            <blockquote style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', color: '#2A221E', fontWeight: 300, textAlign: 'center', lineHeight: 1.5 }}>
              "Two imperfect people choosing each other perfectly."
            </blockquote>
          </div>

          {/* Partner B */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg, #6B7A4B, #2A221E)', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '8rem', color: '#FAF6EF', opacity: 0.9, userSelect: 'none' }}>
                B
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.75rem', marginBottom: '0.5rem' }}>The Groom</h3>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B4543A', marginBottom: '1rem' }}>Partner Two</div>
            <p style={{ color: '#7A6B5D', fontSize: '1.05rem', lineHeight: 1.7 }}>
              [His story goes here — where he grew up, his favourite moments, the thing he said that made you say yes. The real version.]
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#5C1F1B', color: '#FAF6EF', padding: '8rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ color: '#A9895A', justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Join Us</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#FAF6EF', marginBottom: '2rem' }}>
            We can't wait to <em style={{ color: '#A9895A' }}>celebrate with you.</em>
          </h2>
          <p style={{ maxWidth: '32rem', margin: '0 auto 2.5rem', color: 'rgba(250,246,239,0.8)', fontSize: '1.15rem', lineHeight: 1.7, fontFamily: 'var(--font-serif)' }}>
            RSVP through our platform to let us know you're coming, pick your meal, and find your seat.
          </p>
          <button className="landing-btn" style={{ background: '#A9895A', borderColor: '#A9895A', color: '#2A221E' }}
            onClick={() => navigate('/rsvp')}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAF6EF'; (e.currentTarget as HTMLElement).style.borderColor = '#FAF6EF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#A9895A'; (e.currentTarget as HTMLElement).style.borderColor = '#A9895A'; }}
          >
            RSVP Now →
          </button>
        </div>
      </section>

    </div>
  );
}
