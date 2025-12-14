import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCountdown(target: string): Countdown {
  const targetMs = new Date(target).getTime();
  const now = Date.now();
  const diff = Math.max(targetMs - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export default function LandingPage() {
  const navigate = useNavigate();
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return formatDateInput(d);
  }, []);

  const [targetDate, setTargetDate] = useState<string>(defaultDate);
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(defaultDate));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const circles: { label: keyof Countdown; value: string }[] = [
    { label: "days", value: countdown.days },
    { label: "hours", value: countdown.hours },
    { label: "minutes", value: countdown.minutes },
    { label: "seconds", value: countdown.seconds },
  ];

  return (
    <section className="bg-background text-center text-text py-20 space-y-20">
      {/* Save the Date Section */}
      <div className="space-y-6">
        <h2 className="text-4xl font-playfair italic text-primary">Save The Date</h2>
        <p className="text-lg font-semibold">Customize your countdown</p>

        <div className="flex flex-col md:flex-row md:items-center justify-center gap-4 max-w-xl mx-auto">
          <label className="text-sm font-semibold text-gray-600" htmlFor="wedding-date">
            Wedding date
          </label>
          <input
            id="wedding-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="border rounded-lg px-3 py-2 shadow-sm"
          />
        </div>

        <div className="flex justify-center gap-6 mt-8 flex-wrap">
          {circles.map(({ label, value }) => (
            <div
              key={label}
              className="w-28 h-28 rounded-full border-2 border-secondary flex flex-col justify-center items-center bg-white/60"
            >
              <span className="text-3xl text-primary font-semibold">{value}</span>
              <span className="text-sm text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bride & Groom Section */}
      <div className="bg-[#fffaf0] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <h3 className="text-lg font-semibold mb-2">Stress-free planning</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Share timelines, notes, and last-minute updates with everyone helping on your big day.
              Keep your vision aligned without endless chats.
            </p>
          </div>

          <div className="mx-auto">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
              alt="Bride and Groom"
              className="w-64 h-64 object-cover rounded-md shadow-lg"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Designed for both of you</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Give guests a beautiful RSVP experience, track VIPs, and manage seating in minutes.
              No more juggling spreadsheets or scattered tools.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Plan. Invite. Celebrate.</h2>
        <p className="max-w-xl mx-auto mt-2 text-gray-600">
          Streamline your wedding with real-time RSVP analytics, seating charts, and guided setup.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            className="px-6 py-3 rounded-2xl bg-accent text-white shadow-lg"
            onClick={() => navigate("/app/events?new=1")}
          >
            Start a new event
          </button>
          <button
            className="px-6 py-3 rounded-2xl border-2 border-accent text-accent shadow-lg"
            onClick={() => navigate("/app/events?demo=1")}
          >
            Explore a demo setup
          </button>
        </div>
      </div>
    </section>
  );
}
