import { Link } from "react-router";

type Section = {
  num: string;
  title: string;
  body: string | string[];
};

const sections: Section[] = [
  {
    num: "01",
    title: "Acceptance of terms",
    body: "By creating a MYBigDay account or using any part of the platform, you agree to these terms. If you are using MYBigDay on behalf of a couple, a family or a company, you confirm you have the authority to accept these terms for them. If you do not agree with them, please do not use the service.",
  },
  {
    num: "02",
    title: "Who may use MYBigDay",
    body: [
      "You must be at least 18 years old, or the age of majority where you live, to hold an account.",
      "The details you give us at sign-up should be accurate and kept up to date.",
      "You are responsible for everything that happens under your credentials. Keep your password private and tell us promptly if you think someone else has access.",
    ],
  },
  {
    num: "03",
    title: "Your account and your event data",
    body: "Your event content remains yours. Guest lists, floor plans, budgets, checklists, photos and RSVP designs you upload remain your content, and we claim no ownership of them. You grant us a limited licence to host, copy, display and process that content for one purpose only: running the service for you. That covers storing it securely, showing it back to you, and rendering your RSVP page for the guests you invite. The licence does not extend beyond those uses.",
  },
  {
    num: "04",
    title: "Guest data and your responsibilities",
    body: [
      "You are the one inviting your guests, so you decide what to collect and why. For the RSVP information you choose to collect, you generally act as the data controller and MYBigDay processes that information on your behalf.",
      "MYBigDay may separately act as a data controller for limited processing necessary to operate and secure the platform and to meet our own legal obligations, such as security logs, fraud and abuse prevention, and aggregate usage statistics.",
      "You must have a lawful basis to collect and store what you gather, including names, contact numbers, dietary needs and accessibility notes.",
      "Do not upload data you have no right to share, and do not use MYBigDay to build lists unrelated to your event.",
      "Tell your guests what you are collecting and how to reach you if they want their details corrected or removed.",
    ],
  },
  {
    num: "05",
    title: "Acceptable use",
    body: "MYBigDay is for planning genuine events. Do not use it for anything unlawful, abusive or misleading, or for unsolicited bulk messaging. Do not scrape the platform, resell access, probe or attack our infrastructure, bypass usage limits, or reverse-engineer any part of the service. Do not upload malware or content that infringes someone else's rights. We may remove content or suspend an account that breaches these rules.",
  },
  {
    num: "06",
    title: "Plans and payment",
    body: [
      "MYBigDay is free to use at the moment. There is no paid plan, and we do not ask you for card or billing details.",
      "We may introduce paid features or subscription plans in the future. Any applicable pricing, billing terms, renewal terms and cancellation rights will be clearly presented before you purchase.",
    ],
  },
  {
    num: "07",
    title: "Availability and changes to the service",
    body: "We aim to keep MYBigDay fast and available, but we cannot promise uninterrupted service. Maintenance, upgrades, network faults and third-party outages all occur. Features change over time as well, and we occasionally retire ones that are no longer used. For material changes that affect how you plan your event, we will give reasonable notice and, wherever we can, a way to export or migrate your data first.",
  },
  {
    num: "08",
    title: "Third-party services",
    body: "Some parts of MYBigDay depend on other providers: maps for venue directions, WhatsApp and SMS links for reaching guests, and email delivery for invitations and notifications. Those services are governed by their own terms and privacy practices, and we do not control how they operate. If one of them is unavailable, the feature that depends on it may be too.",
  },
  {
    num: "09",
    title: "Intellectual property",
    body: "The platform itself remains ours: the software, the interface and design, the MYBigDay name and logo, and our RSVP and floor-plan templates, together with anything licensed to us. You are free to use them as part of the service, and free to share your finished RSVP page and printed charts. You may not copy, resell or repackage our templates, branding or interface as your own product.",
  },
  {
    num: "10",
    // The monetary liability cap is a commercial + legal decision, not set here:
    // a fees-paid cap resolves to RM0 while the product is free. To be reviewed by counsel.
    title: "Limitation of liability",
    body: "To the fullest extent the law allows, MYBigDay is provided \"as is\" and without warranties of any kind. We are not liable for indirect, incidental or consequential loss, including lost profits or lost opportunities, or from an event that did not go to plan. Where liability cannot be excluded, it is limited to the maximum extent permitted by law. Nothing in these terms limits liability that cannot be limited by law, including liability for death or personal injury caused by negligence, or for fraud. Please keep your own copies of anything critical, and export your guest list, seating chart and budget before the event.",
  },
  {
    num: "11",
    title: "Suspension and termination",
    body: "You can close your account at any time from your settings. We may suspend or end an account that breaches these terms, creates risk for other users, or has fees outstanding, and we will give notice where it is reasonable to do so. Export what you need before you go: once an account is deleted, your event data is removed on the schedule set out in our privacy policy and we may not be able to bring it back.",
  },
  {
    num: "12",
    title: "Governing law and disputes",
    body: "These terms are governed by the laws of Malaysia, and the courts of Malaysia have jurisdiction over any dispute arising from them. If a problem does come up, contact us first. Most turn out to be a misunderstanding or a bug, and both are quicker to resolve directly.",
  },
  {
    num: "13",
    title: "Changes to these terms",
    body: "We update these terms from time to time. We will post the new version on this page. If a change is significant, we will also let you know by email or in the app. Continuing to use the service after an update means you accept the revised terms.",
  },
  {
    num: "14",
    title: "Contact",
    body: "If you have questions about these terms, your plan or your data, get in touch and we will talk them through.",
  },
];

export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E', overflowX: 'hidden' }}>

      {/* Page hero */}
      <section style={{ padding: 'clamp(5rem, 12vw, 8rem) 2.5rem clamp(3rem, 8vw, 5rem)', background: '#F5EFE6', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Legal</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: '20ch',
              margin: '0 auto 1.5rem',
            }}
          >
            Terms & <em style={{ color: '#B4543A' }}>conditions.</em>
          </h1>
          <p style={{ color: '#6B5D50', fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', maxWidth: '38rem', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            The agreement between you and MYBigDay: what we promise, what we ask of you, and how we look after the event you are planning.
          </p>
        </div>
      </section>

      {/* Terms content */}
      <section style={{ background: '#FAF6EF', padding: 'clamp(3.5rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>

            {/* Numbered sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2.5rem, 6vw, 3.5rem)' }}>
              {sections.map(s => (
                <div key={s.num}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', color: '#B4543A' }}>
                      {s.num} /
                    </span>
                    <h2
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 300,
                        fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                        margin: 0,
                      }}
                    >
                      {s.title}
                    </h2>
                  </div>

                  {Array.isArray(s.body) ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {s.body.map((point, j) => (
                        <li
                          key={j}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '0.75rem' }}
                        >
                          <span style={{ color: '#B4543A', fontStyle: 'italic', fontFamily: 'var(--font-display)', flexShrink: 0 }}>✦</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.75, margin: 0 }}>
                      {s.body}
                    </p>
                  )}

                  {s.num === "04" && (
                    <p style={{ color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.75, marginTop: '1rem', marginBottom: 0 }}>
                      How we handle guest details on your behalf is set out in our{' '}
                      <Link to="/privacy" style={{ color: '#B4543A', textDecoration: 'underline' }}>Privacy Notice</Link>.
                    </p>
                  )}

                  {s.num === "14" && (
                    <p style={{ color: '#6B5D50', fontSize: '1.05rem', lineHeight: 1.75, marginTop: '1rem', marginBottom: 0 }}>
                      Reach us through the{' '}
                      <Link to="/contact" style={{ color: '#B4543A', textDecoration: 'underline' }}>contact page</Link>
                      {' '}and we will get back to you.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Closing line */}
            <div style={{ textAlign: 'center', marginTop: 'clamp(3.5rem, 8vw, 5rem)', paddingTop: 'clamp(2rem, 5vw, 3rem)', borderTop: '1px solid #EDE4D3' }}>
              <div style={{ color: '#B4543A', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '0.75rem' }}>✦</div>
              <p style={{ color: '#6B5D50', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                Thank you for planning your big day with us.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
