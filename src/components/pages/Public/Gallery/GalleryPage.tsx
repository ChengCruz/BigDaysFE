import { useState } from "react";

const filters = ["All", "Ceremony", "Reception", "Details", "Portraits"];

const tiles = [
  { id: 1, span: "g1", gradient: "linear-gradient(135deg, #f0d5b8, #B4543A 70%, #5C1F1B)", monogram: "E & M", couple: "Elena & Matteo", location: "Puglia, Italy · 2024" },
  { id: 2, span: "g2", gradient: "linear-gradient(135deg, #e8d8c0, #A9895A, #6B7A4B)",    monogram: "C & J", couple: "Celia & Joaquin", location: "Ojai, California · 2024" },
  { id: 3, span: "g3", gradient: "linear-gradient(160deg, #f5efe6, #d4a574, #8C3A25)",    monogram: "A & P", couple: "Annabel & Piers",  location: "Cotswolds, UK" },
  { id: 4, span: "g4", gradient: "linear-gradient(135deg, #6B7A4B, #2A221E)",             monogram: "N & W", couple: "Nina & Will",      location: "Hudson Valley, NY" },
  { id: 5, span: "g5", gradient: "linear-gradient(135deg, #d4a574, #B4543A)",             monogram: "F & A", couple: "Francesca & Adil", location: "Marrakech, Morocco" },
  { id: 6, span: "g6", gradient: "linear-gradient(135deg, #5C1F1B, #2A221E)",             monogram: "D & H", couple: "Delphine & Henry", location: "Saint-Paul-de-Vence, France · 2023" },
  { id: 7, span: "g7", gradient: "linear-gradient(135deg, #EDE4D3, #A9895A, #5C1F1B)",   monogram: "O & R", couple: "Olive & Rafe",      location: "Florence, Italy" },
  { id: 8, span: "g8", gradient: "linear-gradient(135deg, #f0d5b8, #6B7A4B)",            monogram: "S & J", couple: "Sarah & James",    location: "London, UK · 2025" },
  { id: 9, span: "g9", gradient: "linear-gradient(135deg, #A9895A, #2A221E)",            monogram: "L & S", couple: "Lila & Simon",     location: "Edinburgh, Scotland" },
];

const spanStyles: Record<string, React.CSSProperties> = {
  g1: { gridColumn: 'span 5', aspectRatio: '4/5' },
  g2: { gridColumn: 'span 7', aspectRatio: '7/5' },
  g3: { gridColumn: 'span 4', aspectRatio: '1/1' },
  g4: { gridColumn: 'span 4', aspectRatio: '1/1' },
  g5: { gridColumn: 'span 4', aspectRatio: '1/1' },
  g6: { gridColumn: 'span 7', aspectRatio: '7/4' },
  g7: { gridColumn: 'span 5', aspectRatio: '5/6' },
  g8: { gridColumn: 'span 6', aspectRatio: '3/2' },
  g9: { gridColumn: 'span 6', aspectRatio: '3/2' },
};

export default function GalleryPage() {
  const [active, setActive] = useState("All");
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 4rem', background: '#F5EFE6', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Selected Work</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '20ch', margin: '0 auto 1.5rem' }}>
            A decade of <em style={{ color: '#B4543A' }}>gatherings.</em>
          </h1>
          <p style={{ color: '#7A6B5D', fontSize: '1.25rem', maxWidth: '38rem', margin: '0 auto 3rem', lineHeight: 1.7 }}>
            Each wedding in our archive is its own universe — specific, particular, unrepeatable.
          </p>

          {/* Filter bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActive(f)}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: active === f ? '#2A221E' : 'transparent',
                  border: '1px solid',
                  borderColor: active === f ? '#2A221E' : '#EDE4D3',
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase' as const,
                  color: active === f ? '#FAF6EF' : '#2A221E',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section style={{ background: '#FAF6EF', padding: '4rem 2.5rem 8rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}
               className="grid-cols-2 md:grid-cols-12">
            {tiles.map(tile => (
              <div
                key={tile.id}
                style={{ ...spanStyles[tile.span], position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.5s ease', transform: hovered === tile.id ? 'translateY(-6px)' : 'translateY(0)' }}
                onMouseEnter={() => setHovered(tile.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Gradient tile */}
                <div style={{ width: '100%', height: '100%', background: tile.gradient, position: 'relative', overflow: 'hidden', aspectRatio: 'inherit' }}>
                  {/* Botanical lines overlay */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }} aria-hidden>
                    <g fill="none" stroke="#FAF6EF" strokeWidth="1">
                      <path d="M50 380 Q80 280 100 200 Q120 120 110 40" />
                      <path d="M100 220 Q70 205 50 180" />
                      <path d="M105 180 Q135 165 155 140" />
                    </g>
                  </svg>

                  {/* Monogram */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '4rem', color: '#FAF6EF', opacity: 0.85, zIndex: 2, whiteSpace: 'nowrap' }}>
                    {tile.monogram}
                  </div>

                  {/* Caption overlay on hover */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '2rem 1.5rem 1.5rem',
                    background: 'linear-gradient(to top, rgba(42,34,30,0.9), transparent)',
                    color: '#FAF6EF',
                    opacity: hovered === tile.id ? 1 : 0,
                    transform: hovered === tile.id ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.4s ease',
                    zIndex: 3,
                  }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.4rem', marginBottom: '0.25rem' }}>{tile.couple}</h4>
                    <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#A9895A' }}>{tile.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote bar */}
      <div style={{ background: '#2A221E', color: '#FAF6EF', padding: '4rem 2.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', maxWidth: '40rem', margin: '0 auto', color: '#EDE4D3', lineHeight: 1.5 }}>
          "The wedding is the shortest part of the marriage — <em>we try to make it the most deliberate.</em>"
        </p>
      </div>

    </div>
  );
}
