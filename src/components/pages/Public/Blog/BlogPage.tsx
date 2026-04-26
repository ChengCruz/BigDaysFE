import { useState } from "react";
import { useNavigate } from "react-router-dom";

const posts = [
  {
    num: "No. 01",
    date: "April 2026",
    tag: "Planning",
    title: "The seating chart conversation every couple needs to have",
    excerpt: "It's rarely about the tables. How to navigate family politics, old tensions, and the question of whether children belong near the dance floor.",
    gradient: "linear-gradient(135deg, #d4a574, #B4543A)",
  },
  {
    num: "No. 02",
    date: "March 2026",
    tag: "RSVPs",
    title: "Why paper RSVPs are costing you three extra hours",
    excerpt: "A calm, honest look at where manual tracking breaks down — and what it feels like when your guest list runs itself instead.",
    gradient: "linear-gradient(135deg, #6B7A4B, #2A221E)",
  },
  {
    num: "No. 03",
    date: "February 2026",
    tag: "Budget",
    title: "The five budget items couples always forget",
    excerpt: "Gratuities, alterations, day-of transport, extra printing. The small expenses that quietly add up to something significant.",
    gradient: "linear-gradient(135deg, #A9895A, #5C1F1B)",
  },
  {
    num: "No. 04",
    date: "January 2026",
    tag: "Design",
    title: "How your RSVP page sets the tone before anything else",
    excerpt: "First impressions matter. What your digital invitation says about your wedding — before guests even arrive.",
    gradient: "linear-gradient(135deg, #f0d5b8, #B4543A 60%, #5C1F1B)",
  },
];

export default function BlogPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 6rem', background: '#F5EFE6', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Wedding Blog</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '20ch', margin: '0 auto 1.5rem' }}>
            Honest notes on <em style={{ color: '#B4543A' }}>planning well.</em>
          </h1>
          <p style={{ color: '#7A6B5D', fontSize: '1.25rem', maxWidth: '38rem', margin: '0 auto', lineHeight: 1.7 }}>
            Practical, considered writing for couples who want to plan thoughtfully — not just quickly.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }} className="grid-cols-1 md:grid-cols-2">
            {posts.map((post, i) => (
              <article
                key={i}
                style={{ border: '1px solid #EDE4D3', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s ease', transform: hovered === i ? 'translateY(-6px)' : 'translateY(0)', boxShadow: hovered === i ? '0 20px 50px rgba(92,31,27,0.12)' : 'none' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Visual header */}
                <div style={{ height: '200px', background: post.gradient, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '1rem', left: '1.5rem', fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,246,239,0.7)' }}>{post.num} · {post.date}</div>
                  <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', background: '#B4543A', color: '#FAF6EF', padding: '0.3rem 0.75rem' }}>{post.tag}</div>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem 2.5rem 2.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.75rem', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>{post.title}</h3>
                  <p style={{ color: '#7A6B5D', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{post.excerpt}</p>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B4543A' }}>
                    Read More →
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#F5EFE6', padding: '8rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>See More</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2.25rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '2rem' }}>
            More writing lives on <em style={{ color: '#B4543A' }}>Instagram.</em>
          </h2>
          <p style={{ color: '#7A6B5D', maxWidth: '32rem', margin: '0 auto 2.5rem', fontSize: '1.15rem', lineHeight: 1.7 }}>
            Behind-the-scenes planning tips, feature updates, and the occasional story that didn't fit in a blog post.
          </p>
          <button className="landing-btn landing-btn-outline" onClick={() => navigate('/contact')}>@mybigday →</button>
        </div>
      </section>

    </div>
  );
}
