import { NavLink } from "react-router-dom";

const navGroups = [
  {
    title: "Explore",
    links: [
      { to: "/",        label: "Home"    },
      { to: "/story",   label: "Our Story" },
      { to: "/events",  label: "Events"  },
      { to: "/rsvp",    label: "RSVP"    },
    ],
  },
  {
    title: "Connect",
    links: [
      { to: "/contact", label: "Contact" },
      { to: "/login",   label: "Sign in" },
      { to: "/register",label: "Get started" },
    ],
  },
];

const socials = ["Instagram", "Pinterest", "TikTok", "YouTube"];

export function Footer() {
  return (
    <footer className="relative mt-24 isolate overflow-hidden bg-gradient-to-br from-[#0d0a23] via-[#1b1242] to-[#160a35] text-slate-200">
      <div className="absolute inset-0 noise-overlay opacity-50 pointer-events-none" />
      <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-10">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white font-playfair italic text-lg shadow-lg shadow-fuchsia-500/30">
                C
              </span>
              <span className="font-playfair italic text-3xl bg-gradient-to-r from-fuchsia-200 via-violet-200 to-amber-100 bg-clip-text text-transparent">
                C &amp; C
              </span>
            </div>
            <p className="mt-5 max-w-md text-sm text-slate-300/80 leading-relaxed">
              Cinematic invitations, real-time RSVPs, and a seating planner that thinks like a friend —
              everything for the most beautiful day of your life.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-7 flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur p-1.5"
            >
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-transparent border-none outline-none px-4 text-sm placeholder:text-slate-400 text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-500/30 hover:-translate-y-0.5 transition animate-gradient"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Link columns */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            {navGroups.map((g) => (
              <div key={g.title}>
                <div className="text-xs uppercase tracking-[0.3em] text-violet-200/70">{g.title}</div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {g.links.map((l) => (
                    <li key={l.to}>
                      <NavLink
                        to={l.to}
                        className="text-slate-300 hover:text-white transition"
                      >
                        {l.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social column */}
          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-[0.3em] text-violet-200/70">Follow along</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  className="px-3.5 py-1.5 text-xs rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20 transition"
                >
                  {s}
                </a>
              ))}
            </div>
            <div className="mt-6 text-xs text-slate-400">
              San Francisco · Lisbon · Tokyo
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} My Big Day. Made with love.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
