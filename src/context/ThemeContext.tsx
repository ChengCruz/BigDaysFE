import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
type Theme = "light" | "dark";
interface TCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<TCtx>({ theme: "light", toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
