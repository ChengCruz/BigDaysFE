import { NavLink } from "react-router-dom";

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase' as const,
  color: '#A9895A',
  marginBottom: '1.25rem',
  fontWeight: 400,
};

const linkStyle: React.CSSProperties = {
  color: 'rgba(237, 228, 211, 0.7)',
  textDecoration: 'none',
  fontSize: '1rem',
  transition: 'color 0.3s ease',
  display: 'block',
  marginBottom: '0.6rem',
};

export function Footer() {
  return (
    <footer style={{ background: '#2A221E', color: '#EDE4D3', padding: '5rem 2.5rem 2rem', position: 'relative', zIndex: 2 }}>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '3rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid rgba(237, 228, 211, 0.15)',
        }}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontStyle: 'italic',
              fontWeight: 300,
              marginBottom: '1rem',
              color: '#EDE4D3',
            }}
          >
            My<span style={{ color: '#B4543A' }}>·</span>Big<span style={{ color: '#B4543A' }}>·</span>Day
          </div>
          <p style={{ color: 'rgba(237, 228, 211, 0.6)', maxWidth: '28rem', fontSize: '1rem', fontFamily: 'var(--font-serif)', lineHeight: 1.7 }}>
            A wedding planning platform that keeps every detail — from RSVPs to seating charts — beautifully organised in one place.
          </p>
        </div>

        {/* Explore */}
        <div>
          <div style={labelStyle}>Explore</div>
          <NavLink to="/" style={linkStyle}>Home</NavLink>
          <NavLink to="/story" style={linkStyle}>Story</NavLink>
          <NavLink to="/events" style={linkStyle}>Events</NavLink>
          <NavLink to="/gallery" style={linkStyle}>Gallery</NavLink>
        </div>

        {/* Connect */}
        <div>
          <div style={labelStyle}>Connect</div>
          <NavLink to="/rsvp" style={linkStyle}>RSVP</NavLink>
          <NavLink to="/blog" style={linkStyle}>Blog</NavLink>
          <NavLink to="/contact" style={linkStyle}>Contact</NavLink>
          <NavLink to="/login" style={linkStyle}>Login</NavLink>
        </div>

        {/* Platform */}
        <div>
          <div style={labelStyle}>Platform</div>
          <NavLink to="/login" style={linkStyle}>Start planning</NavLink>
          <NavLink to="/register" style={linkStyle}>Create account</NavLink>
        </div>
      </div>

      {/* Footer bottom */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-label)',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase' as const,
          color: 'rgba(237, 228, 211, 0.5)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span>© {new Date().getFullYear()} My Big Day</span>
        <span>Made with care, not templates</span>
      </div>
    </footer>
  );
}
