// src/components/organisms/Navbar.tsx
import { useTheme } from "../../context/ThemeContext";
import MenuIcon from "@heroicons/react/outline/MenuIcon";
import MoonIcon from "@heroicons/react/outline/MoonIcon";
import SunIcon from "@heroicons/react/outline/SunIcon";
import { EventSwitcher } from "../molecules/EventSwitcher";

export function Navbar({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-4 md:px-6 py-3 bg-background/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10">
      {/* Left: hamburger (mobile) + event switcher */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuToggle && (
          <button
            className="md:hidden p-2 rounded-lg text-text/70 hover:bg-primary/5 dark:text-white/70 dark:hover:bg-white/10 transition flex-shrink-0"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
        <EventSwitcher />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: dark mode toggle */}
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="p-2 rounded-lg text-text/50 hover:text-text hover:bg-primary/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition flex-shrink-0"
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
