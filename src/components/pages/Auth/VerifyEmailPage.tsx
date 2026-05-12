import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthApi } from "../../../api/hooks/useAuthApi";
import toast from "react-hot-toast";

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
  color: '#7A6B5D',
  marginBottom: '0.6rem',
};

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email as string | undefined;
  const { verifyEmail } = useAuthApi();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await verifyEmail.mutateAsync({ token: token.trim() });
      if (result.isSuccess) {
        toast.success("Email verified! You can now sign in.");
        navigate("/login");
      } else {
        setError("Invalid or expired verification code. Please check your email and try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        height: '100vh',
        overflow: 'hidden',
      }}
      className="grid-cols-1 md:grid-cols-2"
    >
      {/* ── Left panel: brand visual ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #B4543A 0%, #5C1F1B 60%, #2A221E 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
        }}
        className="hidden md:flex"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 800"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}
          aria-hidden
        >
          <g fill="none" stroke="#FAF6EF" strokeWidth="1.2">
            <path d="M150 780 Q160 600 180 450 Q200 280 190 120" />
            <path d="M175 520 Q140 500 115 470" />
            <path d="M180 470 Q215 450 240 420" />
            <path d="M175 400 Q145 385 120 355" />
            <path d="M180 350 Q215 330 240 300" />
            <ellipse cx="115" cy="470" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
            <ellipse cx="240" cy="420" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
            <ellipse cx="120" cy="355" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
            <ellipse cx="240" cy="300" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
            <path d="M450 780 Q445 650 460 530 Q475 410 470 270" />
            <path d="M460 580 Q495 560 520 530" />
            <path d="M455 500 Q420 485 395 455" />
            <ellipse cx="520" cy="530" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
            <ellipse cx="395" cy="455" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
          </g>
        </svg>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.6rem', color: '#FAF6EF', letterSpacing: '0.1em' }}>
            My<span style={{ color: '#A9895A' }}>·</span>Big<span style={{ color: '#A9895A' }}>·</span>Day
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 2, color: '#FAF6EF' }}>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#A9895A', marginBottom: '1.5rem' }}>
            One Last Step
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              lineHeight: 1.1,
              marginBottom: '2rem',
              color: '#FAF6EF',
              letterSpacing: '-0.02em',
            }}
          >
            Confirm your<br />
            <em style={{ fontStyle: 'italic', color: '#A9895A' }}>identity.</em>
          </h2>
          <p style={{ color: 'rgba(250,246,239,0.75)', fontSize: '1.1rem', maxWidth: '28rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
            We sent a verification code to your email. Paste it here to activate your account.
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-label)',
            fontSize: '0.65rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(250,246,239,0.5)',
          }}
        >
          <span>Secure · Encrypted</span>
          <span>Est. 2024</span>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div
        style={{
          background: '#FAF6EF',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        className="px-6 md:px-20"
      >
        <div style={{ maxWidth: '26rem', width: '100%', margin: 'auto', padding: '2rem 0' }}>

          <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>Almost There</div>

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
            Verify your{" "}
            <em style={{ fontStyle: 'italic', color: '#B4543A' }}>email.</em>
          </h1>

          <p style={{ color: '#7A6B5D', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
            {email
              ? <>Check <strong style={{ color: '#2A221E' }}>{email}</strong> for your verification code.</>
              : "Check your inbox for your verification code."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div>
              <label style={labelStyle}>Verification Code</label>
              <input
                type="text"
                required
                value={token}
                onChange={e => { setToken(e.target.value); setError(null); }}
                placeholder="Paste the code from your email"
                style={inputStyle}
                autoComplete="off"
                spellCheck={false}
                onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
              />
            </div>

            {error && (
              <p style={{ color: '#B4543A', fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={verifyEmail.isPending || !token.trim()}
              style={{
                width: '100%',
                padding: '1.2rem',
                background: verifyEmail.isPending || !token.trim() ? '#7A6B5D' : '#2A221E',
                color: '#FAF6EF',
                border: 'none',
                fontFamily: 'var(--font-label)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase' as const,
                cursor: verifyEmail.isPending || !token.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={e => { if (!verifyEmail.isPending && token.trim()) (e.currentTarget as HTMLElement).style.background = '#B4543A'; }}
              onMouseLeave={e => { if (!verifyEmail.isPending && token.trim()) (e.currentTarget as HTMLElement).style.background = '#2A221E'; }}
            >
              {verifyEmail.isPending ? "Verifying…" : "Verify Email →"}
            </button>

            <div style={{ textAlign: 'center', color: '#7A6B5D', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
              Already verified?{" "}
              <Link to="/login" style={{ color: '#B4543A', textDecoration: 'none', borderBottom: '1px solid #B4543A', paddingBottom: '1px' }}>
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
