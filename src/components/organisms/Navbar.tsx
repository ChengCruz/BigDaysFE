// src/components/organisms/Navbar.tsx
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../api/hooks/useAuth";
import { useUser  } from "../../context/UserContext";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { logout }        = useAuth();
  const { user, loading } = useUser();

  return (
    <header className="flex items-center justify-between p-4 bg-background text-text shadow">
      <h1 className="text-xl font-bold text-primary">My Big Day</h1>
      <div className="flex items-center space-x-4">
        {!loading && user && (
          <span className="text-sm">Welcome, <strong>{user.name}</strong></span>
        )}
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
