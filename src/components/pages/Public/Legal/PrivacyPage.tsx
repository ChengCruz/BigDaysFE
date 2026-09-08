import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";

const RETENTION_COMMITMENT =
  "RSVP responses are kept only as long as they are needed for your event. We permanently delete all guest RSVP data 90 days after the event ends.";

const PRIVACY_EMAIL = "admin@bigdaysmanager.com";

const linkStyle: CSSProperties = { color: '#B4543A', textDecoration: 'underline' };

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#B4543A',
};

type Block = ReactNode | string[];

type Section = {
  num: string;
  title: ReactNode;
  body: string | Block[];
};

const sections: Section[] = [
  {
    num: "01",
    title: <>About this <em style={{ color: '#B4543A' }}>Privacy Notice</em></>,
    body: [
      "MYBigDay is a wedding and event planning platform. Couples and planners use it to build RSVP pages, manage guest lists, design seating floor plans, check guests in with QR codes, and keep budgets, checklists and timelines in one place.",
      "This Privacy Notice is issued under the Personal Data Protection Act 2010 of Malaysia, as amended in 2024. It explains what personal data we process, why, who we share it with, how long we keep it and what you can ask us to do about it. It applies to our website, our app, and every RSVP page we host on your behalf. It does not cover what happens on a third-party site we link to.",
      <>It sits alongside our <Link to="/terms" style={linkStyle}>Terms &amp; Conditions</Link>, which explain the rules of using MYBigDay.</>,
    ],
  },
  {
    num: "02",
    title: <>Classes of personal data we <em style={{ color: '#B4543A' }}>collect</em></>,
    body: [
      "We collect the following classes of personal data:",
      [
        "Identity data: your name, and the names of the people on your guest list",
        "Contact data: email address, phone number, and postal or venue address where you give one",
        "Account credentials: your email address and a securely hashed password. We never store your password in a readable form",
        "Event details: event names and dates, venues, table layouts, floor plans, vendor notes, checklists and timelines",
        "Guest RSVP data: a guest's name, party size, contact details, attendance status, dietary and accessibility notes, free-text messages, and check-in records if you scan them in on the day",
        "Device and usage data: browser and device type, IP address, approximate location, and the pages you visit",
      ],
      "If an RSVP form you build asks for anything beyond this, those answers are stored too. Ask only for what your event needs.",
    ],
  },
  {
    num: "03",
    title: <>How we <em style={{ color: '#B4543A' }}>obtain</em> your personal data</>,
    body: [
      "We obtain personal data directly from you when you create an account, use the platform or contact us; from event organisers when they add guests to an event; from guests when they submit an RSVP; and automatically from your device when you use the service.",
      "We do not buy or rent personal data from third parties, and we do not build guest lists ourselves. Every guest record on MYBigDay was entered by an event organiser or submitted by the guest.",
    ],
  },
  {
    num: "04",
    title: <>Purposes of <em style={{ color: '#B4543A' }}>collection</em></>,
    body: [
      "We process personal data for these purposes:",
      [
        "To create, secure and administer your MYBigDay account",
        "To deliver your RSVP pages and record replies as they arrive",
        "To keep a live headcount, seat guests at tables and produce seating charts",
        "To generate QR codes and run check-in on the day",
        "To track budgets, expenses, checklists and timelines you enter",
        "To provide customer support and send service emails about your account or event",
        "To keep the platform secure, prevent abuse and investigate incidents",
        "To understand, in aggregate, which features get used so we can improve them",
        "To send marketing about MYBigDay, but only where you have consented",
      ],
      "We will not use your personal data for any purpose beyond those listed above without giving you further notice and, where the law requires it, obtaining your consent.",
      "We do not use guest RSVP data to market to your guests. Those details belong to your event.",
    ],
  },
  {
    num: "05",
    title: <>What is obligatory and what is <em style={{ color: '#B4543A' }}>voluntary</em></>,
    body: [
      "Some fields are required for a function to work. The rest are optional.",
      [
        "Obligatory: your email address and a password. Without them we cannot create or secure an account for you",
        "Obligatory: an event name and date. Without them we cannot build or schedule an event",
        "Obligatory for a guest: their name and party size. Without those we cannot process an RSVP or count them in",
        "Voluntary: phone numbers, dietary and accessibility notes, messages to the couple, photos, and any extra question you add to your form",
      ],
      "If you do not supply obligatory data, the related function will not work: no account, no event, or no recorded RSVP. If you leave voluntary fields blank, everything still works. A guest's RSVP is accepted and counted whether or not they share a phone number or a dietary note.",
    ],
  },
  {
    num: "06",
    title: <>How long we keep <em style={{ color: '#B4543A' }}>RSVP data</em></>,
    body: [
      <div
        style={{
          borderLeft: '3px solid #B4543A',
          background: '#FAF6EF',
          padding: 'clamp(1.1rem, 3vw, 1.5rem) clamp(1.25rem, 3vw, 1.75rem)',
          margin: '0 0 1.5rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)',
            lineHeight: 1.45,
            letterSpacing: '-0.01em',
            color: '#2A221E',
            margin: 0,
          }}
        >
          {RETENTION_COMMITMENT}
        </p>
      </div>,
      "The 90-day period runs from your event's end date. Until it expires the records stay available, so you can reconcile attendance, follow up on no-shows and close out your planning.",
      "Once those 90 days elapse, the guest RSVP records for that event are permanently erased. That includes guest names, contact details, party size, dietary notes and check-in records. The deletion is permanent and cannot be reversed by us or by you.",
      "If you want to keep a record, export your guest list before that date. The export is available from your event's guest list at any time.",
      "We may retain anonymised or aggregate counts, for example how many events used seating last year, because those numbers no longer identify anyone.",
    ],
  },
  {
    num: "07",
    title: <>Everything else we keep, and for <em style={{ color: '#B4543A' }}>how long</em></>,
    body: [
      "Other records are kept for different periods:",
      [
        "Account data: deleted within 90 days after account closure",
        "Event and planning data: kept for as long as the account it belongs to, and removed with it",
        "Backups: deleted data is removed from the live system straight away, and clears from our backups as older backups are replaced by newer ones",
        "Support correspondence: retained only for as long as reasonably necessary to respond to your request and maintain an appropriate support record",
      ],
      "You can ask us to delete your account and its contents at any time.",
    ],
  },
  {
    num: "08",
    title: <>Who we <em style={{ color: '#B4543A' }}>disclose data to</em></>,
    body: [
      "We do not sell personal data, either yours or your guests', to advertisers or to anyone else.",
      "Personal data may be disclosed to these classes of third party, who act as our data processors under contract and only on our instructions:",
      [
        "Cloud hosting and database providers that run the platform",
        "Transactional email delivery services that send invites, confirmations and account mail",
        "Mapping and embed providers that render venue locations",
        "Analytics providers that report aggregate usage",
      ],
      "When you choose to open an external messaging service such as WhatsApp, your use of that service is subject to that provider's own terms and privacy practices.",
      "If you are a guest, your RSVP is also disclosed to the couple or event organiser who owns the event you replied to, and they decide how it is used within that event.",
      "We may also disclose personal data where the law requires it, or to protect the safety of people using MYBigDay.",
    ],
  },
  {
    num: "09",
    title: <>Transfers <em style={{ color: '#B4543A' }}>outside Malaysia</em></>,
    body: [
      "Our primary hosting region is Singapore, so personal data stored on our platform may be hosted and processed on servers located there rather than in Malaysia.",
      "We also use third-party service providers, including cloud storage, content delivery and analytics providers such as Cloudflare and Google Analytics. These providers operate internationally and may process limited personal data in countries outside Malaysia.",
      "Where personal data is transferred or processed outside Malaysia, we use established service providers and take reasonable steps to ensure that appropriate security and data protection safeguards are in place. These may include encryption in transit, access controls, contractual data protection commitments and restrictions on how service providers may use the data.",
      <>You may ask us for more information about where your personal data is processed by contacting <a href={`mailto:${PRIVACY_EMAIL}`} style={linkStyle}>{PRIVACY_EMAIL}</a>.</>,
    ],
  },
  {
    num: "10",
    title: <>Cookies & <em style={{ color: '#B4543A' }}>similar technologies</em></>,
    body: [
      "We use three categories of cookie and local storage:",
      [
        "Strictly necessary and session cookies: they keep you signed in and your session secure. These cannot be switched off, because the app cannot work without them",
        "Preference cookies: they remember small choices, such as a view or language setting, so the app feels the same next time",
        "Analytics cookies: set by Google Analytics, they tell us in aggregate which pages and features get used so we can improve them",
      ],
      "You can control non-essential cookies through your browser settings, which let you block or clear cookies for this site, and you can opt out of Google Analytics entirely using Google's browser opt-out add-on. Clearing or blocking strictly necessary cookies will stop sign-in from working.",
      "Guests do not need an account to RSVP, and we do not track them across other websites.",
    ],
  },
  {
    num: "11",
    title: <>Marketing and your <em style={{ color: '#B4543A' }}>consent</em></>,
    body: [
      "We send marketing email about MYBigDay only where you have consented to receive it. Service emails about your own account or event are separate: those we send because you are using the product.",
      "You can withdraw marketing consent at any time. Every marketing email carries an unsubscribe link, and your account settings include a marketing opt-out that takes effect immediately.",
      "Withdrawing marketing consent does not affect your account or your event. We do not send marketing to the guests on your list.",
    ],
  },
  {
    num: "12",
    title: <>How we keep it <em style={{ color: '#B4543A' }}>secure</em></>,
    body: [
      "Our safeguards include:",
      [
        "Encryption of data in transit over HTTPS",
        "Passwords stored only as salted hashes, never in readable form",
        "Role-based access control, so people see only the events they are entitled to",
        "Least-privilege access to production systems, granted to the few who need it and logged when used",
        "Regular backups, patching and monitoring",
      ],
      "We keep the specifics of these controls confidential, because publishing them would assist an attacker. No system is completely secure, so please use a strong, unique password and do not share your login.",
    ],
  },
  {
    num: "13",
    title: <>If something goes <em style={{ color: '#B4543A' }}>wrong</em></>,
    body: [
      "We maintain a data breach response procedure covering detection, containment, assessment and notification.",
      "Where a personal data breach is notifiable under applicable law, we will notify the Personal Data Protection Commissioner within the prescribed period, currently 72 hours. Where the breach results in or is likely to result in significant harm to affected individuals, we will also notify those individuals as required by law.",
      "Any notice we send to affected individuals will set out what happened, which data was involved and what steps to take.",
    ],
  },
  {
    num: "14",
    title: <>Your rights under the <em style={{ color: '#B4543A' }}>PDPA</em></>,
    body: [
      "You have the right to:",
      [
        "Access the personal data we hold about you, and be told how it is being processed",
        "Correct anything that is inaccurate, incomplete or out of date",
        "Withdraw your consent to processing that relies on consent, including marketing",
        "Limit or stop processing for direct marketing purposes",
        "Portability: ask us to transmit your personal data to another service provider, where technically feasible",
        "Delete your account and the personal data in it, subject to records we must keep by law",
      ],
      <>Most of this you can do yourself from your account settings, including export and account deletion. For anything else, write to <a href={`mailto:${PRIVACY_EMAIL}`} style={linkStyle}>{PRIVACY_EMAIL}</a> or use the <Link to="/contact" style={linkStyle}>contact page</Link>.</>,
      "We respond to rights requests within 21 days. If we need longer, we will tell you why. As the PDPA permits, a reasonable fee may apply to a data access request; we will quote it before doing the work, and we do not charge for correction, withdrawal of consent or opting out of marketing.",
    ],
  },
  {
    num: "15",
    title: <>If you are a <em style={{ color: '#B4543A' }}>guest</em></>,
    body: [
      "If you replied to an RSVP page hosted on MYBigDay, your details sit inside that couple's or planner's event. For the RSVP information an event organiser chooses to collect, the organiser generally acts as the data controller and MYBigDay processes that information on the organiser's behalf.",
      "MYBigDay may separately act as a data controller for limited processing necessary to operate and secure the platform and to meet our own legal obligations, such as security logs, fraud and abuse prevention, and aggregate usage statistics.",
      "To have your details corrected or removed, ask the couple or planner who invited you. They control the guest list for their event and can change or delete your entry themselves at any time, and they are the right people to ask because the event and its data belong to them.",
      "Whether or not you ask, your RSVP details are deleted in full 90 days after the event ends.",
      <>If you cannot reach the couple or planner, contact us through our <Link to="/contact" style={linkStyle}>contact page</Link> and we will pass your request on to them.</>,
    ],
  },
  {
    num: "16",
    title: <>Children's <em style={{ color: '#B4543A' }}>information</em></>,
    body: [
      "MYBigDay is intended for adults planning events. We do not knowingly collect account information from anyone under 18 without a parent or guardian's consent.",
      "Children are often part of a guest list. When you add a minor to your event, limit their details to what the day requires, usually a first name, a seat and a dietary note.",
    ],
  },
  {
    num: "17",
    title: <>Changes to this <em style={{ color: '#B4543A' }}>notice</em></>,
    body: [
      "We update this notice from time to time. When it changes, we post the new version on this page.",
      "If a change materially affects how we handle your personal data, we will email you rather than rely on you noticing it here.",
    ],
  },
  {
    num: "18",
    title: <>Privacy <em style={{ color: '#B4543A' }}>contact</em></>,
    body: [
      "Privacy questions, access requests, corrections, withdrawal of consent and complaints should all be sent to:",
      [
        "Role: Privacy Contact, MYBigDay",
        `Email: ${PRIVACY_EMAIL}`,
        "Response time: within 21 days of receiving your request",
      ],
      <>You can also reach us through the <Link to="/contact" style={linkStyle}>contact page</Link>. If you are not satisfied with how we have handled your request, you may lodge a complaint with the Personal Data Protection Commissioner of Malaysia.</>,
    ],
  },
];

function renderBody(body: Section["body"]) {
  const blocks: Block[] = typeof body === "string" ? [body] : body;

  return blocks.map((block, i) => {
    if (Array.isArray(block)) {
      return (
        <ul key={i} style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem' }}>
          {block.map((point, j) => (
            <li
              key={j}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                color: '#2A221E',
                fontSize: '1rem',
                lineHeight: 1.6,
                marginBottom: '0.6rem',
              }}
            >
              <span style={{ color: '#B4543A', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>✦</span>
              {point}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p
        key={i}
        style={{
          color: '#6B5D50',
          fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
          lineHeight: 1.75,
          margin: '0 0 1.25rem',
        }}
      >
        {block}
      </p>
    );
  });
}

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: '#2A221E', overflowX: 'hidden' }}>

      {/* Page hero */}
      <section style={{ padding: '8rem 2.5rem 4rem', background: '#F5EFE6', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex', marginBottom: '1.5rem' }}>Privacy</div>
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
            Privacy <em style={{ color: '#B4543A' }}>Notice.</em>
          </h1>
          <p style={{ color: '#6B5D50', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', maxWidth: '38rem', margin: '0 auto', lineHeight: 1.7 }}>
            Planning a wedding means gathering a fair amount of personal detail about the people closest to you. This Privacy Notice sets out what we collect, what we do with it, who sees it, and when we delete it.
          </p>
        </div>
      </section>


      {/* Short summary */}
      <section style={{ background: '#FAF6EF', padding: '4rem 2.5rem 0', borderTop: '1px solid #EDE4D3' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>

            <div
              style={{
                border: '1px solid rgba(180, 84, 58, 0.3)',
                background: '#fff',
                padding: 'clamp(1.5rem, 3vw, 2.25rem)',
                marginBottom: '2rem',
              }}
            >
              <div style={{ ...labelStyle, marginBottom: '1rem' }}>In Short</div>
              <p style={{ color: '#6B5D50', fontSize: '1rem', lineHeight: 1.75, margin: 0, maxWidth: '68ch' }}>
                We collect your account details, the event details you enter, and the RSVP details your guests submit. We use them to run your event: to deliver RSVP pages, count replies, seat guests and support you. Guest RSVP data is permanently deleted 90 days after the event ends. You may access, correct, port or delete your personal data, or withdraw your consent, by writing to{' '}
                <a href={`mailto:${PRIVACY_EMAIL}`} style={linkStyle}>{PRIVACY_EMAIL}</a> or using our{' '}
                <Link to="/contact" style={linkStyle}>contact page</Link>.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Notice sections */}
      <section style={{ background: '#FAF6EF', padding: '4rem 2.5rem 8rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {sections.map(section => (
              <article key={section.num} style={{ marginBottom: '3.5rem' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#B4543A',
                    marginBottom: '1rem',
                  }}
                >
                  {section.num} / Privacy Notice
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300,
                    fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    margin: '0 0 1.25rem',
                  }}
                >
                  {section.title}
                </h2>
                {renderBody(section.body)}
              </article>
            ))}

            <div style={{ borderTop: '1px solid #EDE4D3', paddingTop: '2.5rem' }}>
              <p style={{ color: '#6B5D50', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                See also our <Link to="/terms" style={linkStyle}>Terms &amp; Conditions</Link>, or{' '}
                <Link to="/contact" style={linkStyle}>get in touch</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
