
export default function EventsPublicPage() {
  return (
    <section className="py-20 bg-background text-text">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-4xl font-playfair italic text-primary text-center">
          Wedding Events
        </h2>
        <ul className="space-y-4">
          {[
            { label: "Ceremony", date: "Feb 14, 2025", time: "10:00 AM" },
            { label: "Reception", date: "Feb 14, 2025", time: "6:00 PM" },
          ].map((ev) => (
            <li
              key={ev.label}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between"
            >
              <span className="font-semibold">{ev.label}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ev.date} @ {ev.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
