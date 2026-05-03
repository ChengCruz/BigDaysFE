// src/components/organisms/PublicNavbar.tsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

const links = [
  { to: "/",        label: "Home"    },
  { to: "/story",   label: "Story"   },
  { to: "/events",  label: "Events"  },
  { to: "/rsvp",    label: "RSVP"    },
  { to: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-white/70 dark:bg-slate-950/60 border-b border-white/40 dark:border-white/5 shadow-[0_8px_30px_-12px_rgba(31,41,55,0.15)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        <NavLink to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white font-playfair italic text-lg shadow-lg shadow-fuchsia-500/30 transition-transform group-hover:scale-105">
            C
          </span>
          <span className="font-playfair italic text-2xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent dark:from-violet-200 dark:via-fuchsia-200 dark:to-rose-200">
            C &amp; C
          </span>
        </NavLink>

        {/* desktop links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `relative px-4 py-2 rounded-full transition ${
                  isActive
                    ? "text-violet-700 dark:text-violet-200 bg-violet-100/70 dark:bg-white/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-white px-4 py-2 rounded-full transition"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-medium px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-[0_10px_30px_-10px_rgba(124,92,255,0.65)] hover:-translate-y-0.5 transition animate-gradient"
          >
            Get started
          </button>
        </div>

        {/* mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <XIcon className="h-6 w-6 text-slate-800 dark:text-white" />
          ) : (
            <MenuIcon className="h-6 w-6 text-slate-800 dark:text-white" />
          )}
        </button>
      </div>

      {/* mobile menu panel */}
      {open && (
        <nav className="md:hidden border-t border-white/40 dark:border-white/5 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80">
          <ul className="py-3 px-6 font-medium">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `block py-3 px-3 rounded-xl transition ${
                      isActive
                        ? "text-violet-700 dark:text-violet-200 bg-violet-100/70 dark:bg-white/10"
                        : "text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5"
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="pt-3 mt-2 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setOpen(false); navigate("/login"); }}
                className="py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-sm"
              >
                Sign in
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/register"); }}
                className="py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white text-sm shadow-md"
              >
                Get started
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
