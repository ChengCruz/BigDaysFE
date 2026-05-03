const team = [
  {
    initial: "J",
    name: "JC Ng",
    role: "Founder & Lead Product",
    bio: "JC built My Big Day after going through his own wedding planning and finding it far more chaotic than it needed to be. He leads the product, driven by a belief that one well-designed tool beats five mediocre ones.",
    gradient: "linear-gradient(135deg, #EDE4D3, #B4543A)",
  },
  {
    initial: "C",
    name: "Cruz Chua",
    role: "Founder & Creative Director",
    bio: "Cruz is the creative force behind My Big Day's look and feel. Co-founding the platform with a conviction that planning something meaningful should be as beautiful as the day itself.",
    gradient: "linear-gradient(135deg, #A9895A, #5C1F1B)",
  },
];

export default function PeoplePage() {
  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 6rem', background: '#F5EFE6', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Who We Are</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: '20ch', margin: '0 auto 1.5rem' }}>
            The <em style={{ color: '#B4543A' }}>entire</em> team.
          </h1>
          <p style={{ color: '#7A6B5D', fontSize: '1.25rem', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.7 }}>
            A small, obsessive group of people who believe wedding planning should feel as beautiful as the day itself.
          </p>
        </div>
      </section>

      {/* Team grid */}
      <section style={{ background: '#FAF6EF', padding: '8rem 2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3rem', textAlign: 'center', maxWidth: '860px', margin: '0 auto' }} className="grid-cols-1 md:grid-cols-2">
            {team.map((member, i) => (
              <div key={i}>
                {/* Avatar */}
                <div style={{ aspectRatio: '3/4', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden', background: member.gradient }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '8rem', color: '#FAF6EF', opacity: 0.9, zIndex: 2, userSelect: 'none' }}>
                    {member.initial}
                  </div>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{member.name}</h3>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B4543A', marginBottom: '1rem' }}>
                  {member.role}
                </div>
                <p style={{ color: '#7A6B5D', fontSize: '1rem', lineHeight: 1.7 }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
