// src/components/organisms/Navbar.tsx
import { useTheme } from "../../context/ThemeContext";
import { useEventContext } from "../../context/EventContext";
import { MenuIcon, MoonIcon, SunIcon } from "@heroicons/react/outline";

export function Navbar({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const { theme, toggle } = useTheme();
  const { event } = useEventContext();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-6 py-3 bg-background/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10">
      {/* Left: hamburger (mobile) + event context breadcrumb */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            className="md:hidden p-2 rounded-lg text-text/70 hover:bg-primary/5 dark:text-white/70 dark:hover:bg-white/10 transition"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
        {event && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-text/50 dark:text-white/50">{event.title}</span>
            {event.date && (
              <>
                <span className="text-text/20 dark:text-white/20">/</span>
                <span className="text-text/40 dark:text-white/40">
                  {new Date(event.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: dark mode toggle */}
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="p-2 rounded-lg text-text/50 hover:text-text hover:bg-primary/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition"
      >
        {theme === "light" ? (
          <MoonIcon className="h-5 w-5" />
        ) : (
          <SunIcon className="h-5 w-5" />
        )}
      </button>
    </header>
  );
}
