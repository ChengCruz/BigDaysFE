// src/components/pages/Public/RSVPPublic/RsvpSuccessScreen.tsx
import type { RsvpDesign } from "../../../../types/rsvpDesign";

interface Props {
  guestName: string;
  design: RsvpDesign;
}

export default function RsvpSuccessScreen({ guestName, design }: Props) {
  const accentColor = design.accentColor ?? "#f97316";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4 text-white">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {design.globalBackgroundType === "color" && (
          <div className="h-full w-full" style={{ background: design.globalBackgroundColor }} />
        )}
        {design.globalBackgroundType === "image" && design.globalBackgroundAsset && (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${design.globalBackgroundAsset})` }}
          />
        )}
        {design.globalBackgroundType === "video" && design.globalBackgroundAsset && (
          <video
            className="h-full w-full object-cover"
            src={design.globalBackgroundAsset}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(15,23,42,${design.globalOverlay})` }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Animated checkmark */}
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2"
          style={{
            background: `${accentColor}20`,
            borderColor: `${accentColor}50`,
          }}
        >
          <svg
            className="h-12 w-12"
            style={{ color: accentColor }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-white drop-shadow">
            {guestName ? `Thank you, ${guestName}!` : "Thank you!"}
          </h1>
          <p className="text-lg text-white/80">
            Your RSVP has been received.
          </p>
          <p className="text-sm text-white/50 leading-relaxed">
            We're looking forward to celebrating with you. A confirmation will
            be sent to your email.
          </p>
        </div>

        {/* Accent divider */}
        <div
          className="mx-auto h-px w-16 rounded-full opacity-50"
          style={{ background: accentColor }}
        />

        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          See you soon
        </p>
      </div>
    </div>
  );
}
