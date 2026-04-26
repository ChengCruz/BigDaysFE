import { useState } from "react";
import { NavLink } from "react-router-dom";

const navLinks = [
  { to: "/",        label: "HOME",    end: true },
  { to: "/story",   label: "STORY",   end: false },
  { to: "/events",  label: "EVENTS",  end: false },
  { to: "/people",  label: "PEOPLE",  end: false },
  { to: "/gallery", label: "GALLERY", end: false },
  { to: "/rsvp",    label: "RSVP",    end: false },
  { to: "/blog",    label: "BLOG",    end: false },
  { to: "/contact", label: "CONTACT", end: false },
];

const navLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  position: 'relative',
  padding: '0.25rem 0',
  transition: 'color 0.3s ease',
};

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(250, 246, 239, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(42, 34, 30, 0.08)',
        padding: '1.25rem 2.5rem',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand */}
        <NavLink
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.5rem',
            letterSpacing: '0.15em',
            color: '#2A221E',
            fontStyle: 'italic',
            textDecoration: 'none',
          }}
        >
          My<span style={{ color: '#B4543A' }}>·</span>Big<span style={{ color: '#B4543A' }}>·</span>Day
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center" style={{ gap: '2.5rem' }}>
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                ...navLinkStyle,
                color: isActive ? '#B4543A' : '#2A221E',
                textDecoration: 'none',
              })}
            >
              {label}
            </NavLink>
          ))}

          {/* Login button */}
          <NavLink
            to="/login"
            style={({ isActive }) => ({
              fontFamily: 'var(--font-label)',
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase' as const,
              padding: '0.65rem 1.5rem',
              border: `1px solid ${isActive ? '#B4543A' : '#2A221E'}`,
              background: isActive ? '#B4543A' : 'transparent',
              color: isActive ? '#FAF6EF' : '#2A221E',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'inline-block',
            })}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#2A221E';
              (e.currentTarget as HTMLElement).style.color = '#FAF6EF';
            }}
            onMouseLeave={e => {
              const isActive = (e.currentTarget as HTMLElement).getAttribute('aria-current') === 'page';
              (e.currentTarget as HTMLElement).style.background = isActive ? '#B4543A' : 'transparent';
              (e.currentTarget as HTMLElement).style.color = isActive ? '#FAF6EF' : '#2A221E';
            }}
          >
            LOGIN
          </NavLink>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#2A221E', padding: '0.25rem' }}
          aria-label="Toggle menu"
          onClick={() => setOpen(o => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '80%',
            maxWidth: '320px',
            background: '#FAF6EF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '2rem',
            padding: '2.5rem',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
            zIndex: 99,
          }}
        >
          {[...navLinks, { to: '/login', label: 'LOGIN', end: false }].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                fontFamily: 'var(--font-label)',
                fontSize: '0.8rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase' as const,
                color: isActive ? '#B4543A' : '#2A221E',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              })}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
