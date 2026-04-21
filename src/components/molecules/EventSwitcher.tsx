import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  ChevronDownIcon,
  LocationMarkerIcon,
  SwitchHorizontalIcon,
} from "@heroicons/react/outline";

// Inline SVGs used in place of heroicons PlusIcon / SearchIcon — the deploy
// CI's heroicons resolution rejected those specific exports, so we avoid them.
const PlusIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const SearchIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
import { CheckCircleIcon } from "@heroicons/react/solid";
import { useEventContext } from "../../context/EventContext";
import { formatEventDate, formatEventTime } from "../../utils/eventUtils";

/**
 * Compact event switcher for the top navbar.
 * Replaces the old sidebar card + full-screen EventSelectorModal.
 */
export function EventSwitcher() {
  const { event, events = [], eventId, setEventId, mustChooseEvent } = useEventContext();
  const navigate = useNavigate();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events
      .filter((e) => (showArchived ? true : !e?.raw?.isDeleted))
      .filter((e) =>
        term
          ? e.title.toLowerCase().includes(term) ||
            e.location?.toLowerCase().includes(term)
          : true
      )
      .sort((a, b) => {
        const now = Date.now();
        const aFuture = new Date(a.date).getTime() >= now;
        const bFuture = new Date(b.date).getTime() >= now;
        if (aFuture !== bFuture) return aFuture ? -1 : 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [events, search, showArchived]);

  const archivedCount = useMemo(
    () => events.filter((e) => e?.raw?.isDeleted).length,
    [events]
  );

  const captureAnchor = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setAnchor({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 340) });
  };

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    captureAnchor();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 0);

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        triggerRef.current && !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => captureAnchor();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open]);

  const handleSelect = (id: string) => {
    setEventId(id);
    setOpen(false);
  };

  const handleCreateNew = () => {
    setOpen(false);
    navigate("/app/events?new=1");
  };

  const handleManage = () => {
    setOpen(false);
    navigate("/app/events");
  };

  const triggerLabel = event?.title ?? (mustChooseEvent ? "Select an event" : "No event");
  const triggerSub = event?.date ? formatEventDate(event.date) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition border
          ${mustChooseEvent
            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-400/30 dark:text-amber-300"
            : "bg-primary/5 border-primary/15 text-text hover:bg-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          }`}
      >
        <CalendarIcon className={`h-4 w-4 flex-shrink-0 ${mustChooseEvent ? "text-amber-500" : "text-primary"}`} />
        <div className="text-left leading-tight min-w-0 max-w-[180px] md:max-w-[260px]">
          <p className="text-[10px] uppercase tracking-wide text-text/40 dark:text-white/40 font-medium">
            {mustChooseEvent ? "Pick one" : "Active event"}
          </p>
          <p className="text-sm font-semibold truncate">{triggerLabel}</p>
        </div>
        {triggerSub && (
          <span className="hidden lg:inline text-[11px] text-text/50 dark:text-white/40 font-medium whitespace-nowrap">
            · {triggerSub}
          </span>
        )}
        <ChevronDownIcon className={`h-4 w-4 text-text/40 dark:text-white/40 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && anchor && createPortal(
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: anchor.top,
            left: anchor.left,
            width: anchor.width,
            maxWidth: "calc(100vw - 24px)",
            zIndex: 60,
          }}
          className="rounded-2xl shadow-xl border border-primary/15 bg-white dark:bg-slate-900 dark:border-white/10 overflow-hidden animate-fade-in"
          role="listbox"
        >
          <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-white/10">
            <div className="relative">
              <SearchIconSvg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full border border-gray-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
            {archivedCount > 0 && (
              <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-500 dark:text-white/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-3 w-3 accent-primary"
                />
                Show archived ({archivedCount})
              </label>
            )}
          </div>

          <ul className="max-h-[340px] overflow-y-auto p-1.5" role="presentation">
            {visibleEvents.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-gray-500 dark:text-white/40">
                {search ? "No events match your search." : "No events yet."}
              </li>
            ) : (
              visibleEvents.map((ev) => {
                const isActive = eventId === ev.id;
                const isArchived = Boolean(ev?.raw?.isDeleted);
                return (
                  <li key={ev.id} role="option" aria-selected={isActive}>
                    <button
                      onClick={() => handleSelect(ev.id)}
                      className={`w-full text-left rounded-lg px-3 py-2 transition flex items-start gap-3
                        ${isActive
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                    >
                      <span className="mt-0.5 flex-shrink-0">
                        {isActive ? (
                          <CheckCircleIcon className="h-5 w-5 text-primary" />
                        ) : (
                          <span className="h-5 w-5 inline-block rounded-full border border-gray-300 dark:border-white/20" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${isActive ? "font-semibold text-primary" : "font-medium text-slate-800 dark:text-white"}`}>
                            {ev.title}
                          </p>
                          {isArchived && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-semibold uppercase tracking-wide">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-white/50 mt-0.5">
                          <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {formatEventDate(ev.date)}
                            {ev.time && ` · ${formatEventTime(ev.date, ev.time)}`}
                          </span>
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-white/50 mt-0.5">
                            <LocationMarkerIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-gray-100 dark:border-white/10 p-1.5 flex flex-col gap-0.5">
            <button
              onClick={handleCreateNew}
              className="w-full text-left rounded-lg px-3 py-2 text-sm text-primary font-medium hover:bg-primary/5 dark:hover:bg-white/5 transition flex items-center gap-2"
            >
              <PlusIconSvg className="h-4 w-4" />
              Create new event
            </button>
            <button
              onClick={handleManage}
              className="w-full text-left rounded-lg px-3 py-2 text-sm text-text/70 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-2"
            >
              <SwitchHorizontalIcon className="h-4 w-4" />
              Manage all events
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
