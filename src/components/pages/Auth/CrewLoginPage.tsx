// src/components/pages/Auth/CrewLoginPage.tsx
// Dedicated crew (event-day staff) sign-in. Reached via the invite message /
// Crew page link the organiser shares — deliberately kept out of the public nav.
import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../../../api/hooks/useAuth";
import { apiErrorMessage } from "../../../utils/apiError";
import AuthBrandPanel from "./AuthBrandPanel";
import { EyeIcon, EyeOffIcon } from "@heroicons/react/solid";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 0',
  border: 'none',
  borderBottom: '1px solid #EDE4D3',
  background: 'transparent',
  fontFamily: 'var(--font-serif)',
  fontSize: '1.1rem',
  color: '#2A221E',
  outline: 'none',
  transition: 'border-color 0.3s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: '#6B5D50',
  marginBottom: '0.6rem',
};

export default function CrewLoginPage() {
  const { crewLogin, loading, user } = useAuth();
  const nav = useNavigate();

  const [crewCode, setCrewCode] = useState("");
  const [crewPin, setCrewPin] = useState("");
  const [crewEventCode, setCrewEventCode] = useState("");
  const [showCrewPin, setShowCrewPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  // Already signed in — let /app route them to the right place (crew → check-in).
  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!crewCode.trim() || !crewPin) { setError("Crew ID and PIN are required."); return; }
    if (!crewEventCode.trim()) { setError("Event Code is required."); return; }
    try {
      await crewLogin({ crewCode: crewCode.trim(), pin: crewPin, eventCode: crewEventCode.trim() });
      nav("/app/checkin", { replace: true });
    } catch (err: any) {
      setError(apiErrorMessage(err, "Invalid Crew ID, PIN, or Event Code."));
    }
  };

  return (
    <div
      style={{ display: 'grid', minHeight: '100vh', overflow: 'hidden' }}
      className="grid-cols-1 md:grid-cols-2 content-start md:content-stretch"
    >
      {/* ── Left panel: brand showcase ── */}
      <AuthBrandPanel />

      {/* ── Right panel: crew form ── */}
      <div
        style={{ background: '#FAF6EF', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        className="px-6 md:px-20"
      >
        <div style={{ maxWidth: '26rem', width: '100%', margin: 'auto', padding: '2rem 0' }}>

          <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>Event Crew</div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Crew <em style={{ fontStyle: 'italic', color: '#B4543A' }}>sign-in.</em>
          </h1>

          <p style={{ color: '#6B5D50', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
            For event-day staff — enter the Event Code, Crew ID and PIN your organiser gave you.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div>
              <label style={labelStyle}>Event Code</label>
              <input
                type="text"
                required
                value={crewEventCode}
                onChange={e => setCrewEventCode(e.target.value)}
                placeholder="Event Code from your organiser"
                style={inputStyle}
                onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
              />
            </div>
            <div>
              <label style={labelStyle}>Crew ID</label>
              <input
                type="text"
                required
                value={crewCode}
                onChange={e => setCrewCode(e.target.value)}
                placeholder="e.g. CR-001"
                style={inputStyle}
                onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
              />
            </div>
            <div>
              <label style={labelStyle}>PIN</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCrewPin ? "text" : "password"}
                  required
                  value={crewPin}
                  onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCrewPin(v); }}
                  placeholder="4–6 digit PIN"
                  style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                  onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                />
                <button
                  type="button"
                  onClick={() => setShowCrewPin(v => !v)}
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6B5D50' }}
                  aria-label={showCrewPin ? "Hide PIN" : "Show PIN"}
                >
                  {showCrewPin ? <EyeOffIcon style={{ width: '1.1rem', height: '1.1rem' }} /> : <EyeIcon style={{ width: '1.1rem', height: '1.1rem' }} />}
                </button>
              </div>
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.2rem',
                background: loading ? '#6B5D50' : '#2A221E',
                color: '#FAF6EF',
                border: 'none',
                fontFamily: 'var(--font-label)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase' as const,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#B4543A'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2A221E'; }}
            >
              {loading ? "Signing in…" : "Sign In as Crew →"}
            </button>

            <div style={{ textAlign: 'center', color: '#6B5D50', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
              Not event crew?{" "}
              <Link to="/login" style={{ color: '#B4543A', textDecoration: 'none', borderBottom: '1px solid #B4543A', paddingBottom: '1px' }}>
                Admin sign-in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
