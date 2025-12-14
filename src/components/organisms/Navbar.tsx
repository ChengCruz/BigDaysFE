// src/components/organisms/Navbar.tsx
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../api/hooks/useAuth";
import { useEventContext } from "../../context/EventContext";
import { MenuIcon } from "@heroicons/react/outline";
import { Button } from "../atoms/Button";

export function Navbar({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const { event, mustChooseEvent } = useEventContext();

  const eventDate = event?.date ? new Date(event.date).toLocaleDateString() : "Set a date";
  const locationLabel = event?.location || "Add a venue";

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur border-b border-primary/10 dark:border-primary/20 shadow-sm">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            className="md:hidden p-2 rounded-xl bg-accent text-primary hover:bg-primary/10 dark:bg-primary/30 dark:text-white"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white font-bold grid place-items-center shadow-lg shadow-primary/20">MB</div>
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-primary/70 dark:text-primary/60">My Big Days</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Planning dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className={`w-full max-w-xl p-4 rounded-2xl border shadow-sm transition bg-white/70 dark:bg-slate-800/70 ${mustChooseEvent ? "border-amber-300" : "border-primary/10"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-[11px] uppercase tracking-wide font-semibold ${mustChooseEvent ? "text-amber-700" : "text-primary/70 dark:text-primary/60"}`}>
                {mustChooseEvent ? "Choose an event in the sidebar" : "Active event"}
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                {event?.title ?? "Awaiting selection"}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-200 mt-1">
                <span className="px-2 py-1 rounded-full bg-accent/70">{eventDate}</span>
                <span className="px-2 py-1 rounded-full bg-accent/70">{locationLabel}</span>
                <span className="px-2 py-1 rounded-full bg-accent/70">Tables: {event?.noOfTable ?? "-"}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">Sidebar switch</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="p-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
