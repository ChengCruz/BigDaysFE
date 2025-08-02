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
  const { event, openSelector } = useEventContext();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background text-text border-b border-gray-200 shadow">
      {onMenuToggle && (
        <button
          className="md:hidden p-2 rounded hover:bg-secondary/10"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      )}
      <h1 className="text-xl font-bold">
        {event?.title ?? "Select Event"}
      </h1>
      <div className="flex items-center space-x-4">
        <Button variant="secondary" onClick={openSelector}>
          Change Event
        </Button>
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="p-2 rounded-full bg-secondary text-white"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button
          onClick={logout}
          className="px-3 py-1 rounded bg-accent text-white"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
