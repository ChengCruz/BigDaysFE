import { NavLink } from "react-router-dom";
import { BrandWordmark } from "../atoms/BrandWordmark";

const linkStyle: React.CSSProperties = {
  color: 'rgba(237, 228, 211, 0.7)',
  textDecoration: 'none',
  fontFamily: 'var(--font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  transition: 'color 0.3s ease',
};

export function Footer() {
  return (
    <footer style={{ background: '#2A221E', color: '#EDE4D3', padding: '4rem 2.5rem 2rem', position: 'relative', zIndex: 2 }}>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(237, 228, 211, 0.15)',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <BrandWordmark size="1.75rem" />

        {/* Menu — mirrors the top navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          <NavLink to="/" style={linkStyle}>Home</NavLink>
          <NavLink to="/features" style={linkStyle}>Features</NavLink>
          <NavLink to="/contact" style={linkStyle}>Contact</NavLink>
          <NavLink to="/login" style={linkStyle}>Login</NavLink>
        </nav>
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
        <span style={{ textTransform: 'none', display: 'inline-flex', alignItems: 'baseline', gap: '0.4em' }}>© {new Date().getFullYear()} <BrandWordmark size="0.8rem" /></span>
        <span>Planned with love</span>
      </div>
    </footer>
  );
}
