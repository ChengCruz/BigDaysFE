// src/components/organisms/CoupleShell.tsx
//
// The couple-facing chrome: five destinations, a bottom tab bar on mobile and a
// collapsible left rail on desktop.
//
// Secondary destinations (your account, get help) and the switch back to
// planner view live in the rail footer — the same place planner mode puts them
// — with a mirror in the avatar menu because mobile has no rail. Day-of helpers
// are NOT here; they belong to the Big Day tab (see CoupleBigDayPage).
//
// Renders the same <Outlet /> content as PlannerShell; only the chrome differs.

import React from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import pkg from "../../../package.json";
import { Palette } from "@phosphor-icons/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  SwitchHorizontalIcon,
  UserCircleIcon,
} from "@heroicons/react/solid";
import { BrandLogo } from "../atoms/BrandLogo";
import { Dropdown, DropdownItem } from "../atoms/Dropdown";
import { EventSwitcher } from "../molecules/EventSwitcher";
import { COUPLE_SECTIONS, sectionForPath } from "./coupleSections";
import { useAuth } from "../../api/hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { useUiMode } from "../../context/UiModeContext";
import { hasUnseenRelease } from "../../utils/whatsNew";

function initialsFor(email?: string): string {
  if (!email) return "··";
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "··";
}

/**
 * Secondary destinations. Deliberately NOT tabs — a couple visits these rarely.
 *
 * All are app-level and event-independent. `/app/users` is the signed-in user's
 * own profile and password, plus an admin-only list — it is an account page, not
 * a "share access" page, so it is labelled accordingly.
 *
 * `/app/crew` ("Your helpers") deliberately does NOT live here. It is
 * event-scoped, so it changed under you when you switched events while its
 * neighbours did not, and the Big Day tab already lights up for it. It is now
 * reached from CoupleBigDayPage instead. See docs/COUPLE_MODE.md.
 */
const SECONDARY = [
  { to: "/app/whats-new", label: "What's new", Icon: SparklesIcon },
  { to: "/app/contact", label: "Get help", Icon: QuestionMarkCircleIcon },
  { to: "/app/users", label: "Your account", Icon: UserCircleIcon },
];

export function CoupleShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { palette, toggle: togglePalette } = useTheme();
  const { setMode } = useUiMode();

  // Re-read on every navigation (this component re-renders on location change),
  // which is when visiting the page should clear the dot.
  const hasUnseenNews = hasUnseenRelease();

  const [collapsed, setCollapsed] = React.useState(false);
  const active = sectionForPath(pathname);

  return (
    <div className="flex h-screen bg-background text-text">
      {/* ─── Desktop rail ─────────────────────────────────────────────── */}
      <aside
        className={`hidden flex-col border-r border-primary/10 bg-background transition-all md:flex ${
          collapsed ? "w-20" : "w-60"
        }`}
        data-tour="sidebar-nav"
      >
        <div
          className={`flex items-center justify-between border-b border-primary/10 py-4 ${
            collapsed ? "px-3" : "px-5"
          }`}
        >
          <BrandLogo height={collapsed ? 26 : 46} tone="full" />
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-1.5 text-text/50 transition hover:bg-primary/5 hover:text-text"
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {COUPLE_SECTIONS.map(({ key, label, to, Icon, tone }) => {
            const isActive = active?.key === key;
            return (
              <NavLink
                key={key}
                to={to}
                title={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl py-3 text-sm transition-colors ${
                  collapsed ? "justify-center px-2" : "px-3"
                } ${
                  isActive
                    ? `${tone.bg} ${tone.text} font-bold`
                    : "text-text/70 hover:bg-primary/5 hover:text-text"
                }`}
              >
                <span
                  className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ${tone.chip} ${tone.text}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {!collapsed && label}
              </NavLink>
            );
          })}
        </nav>

        {/* ─── Rail footer: secondary links + mode switch ─────────────── */}
        <div className="border-t border-primary/10 p-3">
          {SECONDARY.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors ${
                  collapsed ? "justify-center px-2" : "px-3"
                } ${
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-text/60 hover:bg-primary/5 hover:text-text"
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {/* Unread marker. Sits on the icon when collapsed, since the
                  label it would otherwise follow isn't rendered. */}
              {to === "/app/whats-new" && hasUnseenNews && (
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"
                  aria-label="New updates"
                />
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setMode("planner")}
            title="Switch to advanced view"
            className={`mt-1 flex w-full items-center gap-3 rounded-lg py-2.5 text-sm text-text/60
                        transition-colors hover:bg-primary/5 hover:text-text ${
                          collapsed ? "justify-center px-2" : "px-3"
                        }`}
          >
            <SwitchHorizontalIcon className="h-5 w-5 flex-shrink-0 text-primary" />
            {!collapsed && <span>Switch to advanced view</span>}
          </button>

          {!collapsed && (
            <p className="select-none pt-1.5 text-center text-[10px] tabular-nums text-text/25">
              v{pkg.version}
            </p>
          )}
        </div>
      </aside>

      {/* ─── Main column ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 flex items-center gap-3 border-b border-primary/10
                     bg-background/85 px-4 py-2.5 backdrop-blur-md md:px-6"
        >
          <div className="min-w-0" data-tour="event-switcher">
            <EventSwitcher />
          </div>

          <div className="flex-1" />

          <button
            onClick={togglePalette}
            aria-label={`Switch to ${palette === "rose" ? "Slate" : "Rose"} colours`}
            title={`Switch to ${palette === "rose" ? "Slate" : "Rose"}`}
            className="hidden flex-shrink-0 rounded-lg p-2 text-text/50 transition
                       hover:bg-primary/5 hover:text-text md:block"
          >
            <Palette className="h-5 w-5" weight={palette === "slate" ? "fill" : "regular"} />
          </button>

          {/* Mirrors the rail footer, because mobile has no rail. */}
          <Dropdown
            trigger={
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold
                           text-primary transition-colors hover:bg-primary/20"
                title={user?.email ?? "Account"}
                aria-label="Account"
              >
                {initialsFor(user?.email)}
              </span>
            }
          >
            <DropdownItem onClick={() => navigate("/app/contact")} className="md:hidden">
              Get help
            </DropdownItem>
            <DropdownItem onClick={() => navigate("/app/users")}>Your account</DropdownItem>
            {/* Mobile has no rail, so this is the only way to the release notes there. */}
            <DropdownItem onClick={() => navigate("/app/whats-new")} className="md:hidden">
              What's new{hasUnseenNews ? " ·" : ""}
            </DropdownItem>
            <DropdownItem onClick={togglePalette}>
              Colours — {palette === "rose" ? "Rose" : "Slate"}
            </DropdownItem>
            <DropdownItem onClick={() => setMode("planner")} className="md:hidden">
              Switch to advanced view
            </DropdownItem>
            <DropdownItem onClick={logout} className="text-secondary">
              Sign out
            </DropdownItem>
          </Dropdown>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>

        {/* ─── Mobile tab bar ────────────────────────────────────────── */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-primary/10
                     bg-background/95 px-1 pb-5 pt-1.5 backdrop-blur-md md:hidden"
          aria-label="Sections"
        >
          {COUPLE_SECTIONS.map(({ key, label, to, Icon, tone }) => {
            const isActive = active?.key === key;
            return (
              <NavLink
                key={key}
                to={to}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5
                            text-[10.5px] font-semibold transition-colors ${
                              isActive ? tone.text : "text-text/45"
                            }`}
              >
                <Icon className="h-[19px] w-[19px]" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
