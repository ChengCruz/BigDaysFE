import React, { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem 0',
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

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E' }}>

      {/* Page hero */}
      <section style={{ padding: '5.5rem 2.5rem 3.5rem', background: '#F5EFE6', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Get in Touch</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '20ch', margin: '0 auto 1.25rem' }}>
            Let's begin a <em style={{ color: '#B4543A' }}>conversation.</em>
          </h1>
          <p style={{ color: '#6B5D50', fontSize: '1.25rem', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.7 }}>
            Questions, feedback, or ideas — send them our way and we'll get back to you.
          </p>
        </div>
      </section>

      {/* Contact grid */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: '5rem', alignItems: 'start' }}
          className="grid-cols-1 md:grid-cols-[1.3fr_1fr]"
        >
          {/* Form */}
          <div style={{ background: '#FAF6EF', padding: '3.5rem 3rem', border: '1px solid #EDE4D3', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '2rem', background: '#FAF6EF', padding: '0 0.75rem', color: '#B4543A', fontSize: '1.2rem' }}>✦</div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '4rem', color: '#B4543A', marginBottom: '1rem' }}>✦</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '2.5rem', marginBottom: '1rem' }}>Thank you.</h2>
                <p style={{ color: '#6B5D50', fontSize: '1.1rem', lineHeight: 1.7 }}>We've received your message and will be in touch soon.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '2.5rem', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                  Tell us about your <em style={{ color: '#B4543A' }}>day.</em>
                </h2>
                <p style={{ color: '#6B5D50', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  The more you share, the more helpful we can be.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  <div>
                    <label style={labelStyle}>Your Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" style={inputStyle}
                      onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                      onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" style={inputStyle}
                      onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                      onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Message</label>
                    <textarea
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Tell us about your wedding, your guest count, your date..."
                      rows={5}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', lineHeight: 1.6 }}
                      onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                      onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '1.2rem',
                      background: '#2A221E',
                      color: '#FAF6EF',
                      border: 'none',
                      fontFamily: 'var(--font-label)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase' as const,
                      cursor: 'pointer',
                      transition: 'background 0.3s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#B4543A'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#2A221E'}
                  >
                    Send With Care →
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Sidebar info */}
          <div>
            {[
              { label: "Already a User?", big: null, sub: null, link: true },
            ].map((block, i, arr) => (
              <div key={i} style={{ marginBottom: '3rem', paddingBottom: '3rem', borderBottom: i < arr.length - 1 ? '1px solid #EDE4D3' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#B4543A', marginBottom: '1.5rem', fontWeight: 400 }}>
                  {block.label}
                </div>
                {block.big && (
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.75rem', color: '#2A221E', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                    {block.big}
                  </div>
                )}
                {block.sub && (
                  <p style={{ color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.6 }}>{block.sub}</p>
                )}
                {block.link && (
                  <p style={{ color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.6 }}>
                    Use the{" "}
                    <a href="/login" style={{ color: '#B4543A', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Login Portal</a>
                    {" "}to access your dashboard, guest list, and RSVP responses.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
