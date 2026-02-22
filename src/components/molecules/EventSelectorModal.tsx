import { useState } from "react";
import {
  CalendarIcon,
  LocationMarkerIcon,
  SparklesIcon,
  SwitchHorizontalIcon,
  UserGroupIcon,
  XIcon,
} from "@heroicons/react/outline";
import { useEventContext } from "../../context/EventContext";
import {
  useDeactivateEvent,
  useActivateEvent,
  type Event,
} from "../../api/hooks/useEventsApi";
import { Button } from "../atoms/Button";
import { EventFormModal } from "./EventFormModal";
import { CheckCircleIcon } from "@heroicons/react/solid";

export function EventSelectorModal() {
  const {
    isSelectorOpen,
    mustChooseEvent,
    events = [],
    eventId,
    setEventId,
    closeSelector,
  } = useEventContext();
  const deactivateEvent = useDeactivateEvent();
  const activateEvent = useActivateEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Event | undefined>(undefined);

  const forceOpen = mustChooseEvent || isSelectorOpen;

  if (!forceOpen) return null;

  const handleSelect = (id: string) => {
    setEventId(id);
  };

  const openNewForm = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEditForm = (evt: Event) => {
    setEditing(evt);
    setFormOpen(true);
  };

  const handleDeactivate = (id: string) => deactivateEvent.mutate(id);
  const handleActivate = (id: string) => activateEvent.mutate(id);

  const handleFormClose = () => setFormOpen(false);

  const handleFormSuccess = (evt: Event) => {
    setEventId(evt.id);
    setFormOpen(false);
  };

  const headline = mustChooseEvent
    ? "Choose an event to unlock your dashboard"
    : "Switch the event you're working on";

  const subline = mustChooseEvent
    ? "Pick an existing celebration or create a new one to continue planning."
    : "Keep everything in sync by switching the active event for tables, RSVPs, and wallet.";

  const handleBackdropClick = () => {
    if (!mustChooseEvent) closeSelector();
  };

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* selector panel */}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl grid md:grid-cols-[1fr_1.15fr] overflow-hidden border border-primary/10">
          <div className="relative bg-gradient-to-br from-primary via-slate-900 to-secondary text-white p-8 flex flex-col gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.12),transparent_35%)]" />
            <div className="relative space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/80 font-semibold">
                Event workspace
              </p>
              <h2 className="text-2xl font-bold leading-tight">{headline}</h2>
              <p className="text-indigo-100/90 text-sm max-w-md">{subline}</p>
            </div>

            <div className="relative grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl p-3">
                <SparklesIcon className="w-5 h-5 text-amber-200" />
                <div>
                  <p className="font-semibold">Unified status</p>
                  <p className="text-indigo-100/80">Tables, RSVPs, wallet and seating stay on the active event.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl p-3">
                <UserGroupIcon className="w-5 h-5 text-sky-200" />
                <div>
                  <p className="font-semibold">Safe switching</p>
                  <p className="text-indigo-100/80">Change events without altering any of your existing data.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl p-3">
                <SwitchHorizontalIcon className="w-5 h-5 text-emerald-200" />
                <div>
                  <p className="font-semibold">Quick create</p>
                  <p className="text-indigo-100/80">Start a fresh celebration directly from this selector.</p>
                </div>
              </div>
            </div>

            <div className="relative mt-auto">
              <Button onClick={openNewForm} className="w-full justify-center bg-white text-primary hover:bg-primary/10">
                Start a new event
              </Button>
              <p className="text-xs text-indigo-100/80 text-center mt-3">
                You'll return here whenever you need to focus on a different event.
              </p>
            </div>
          </div>

          <div className="flex flex-col bg-accent/30">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Event library</p>
                <h3 className="text-lg font-semibold text-slate-900">Active & archived plans</h3>
                <p className="text-sm text-gray-600">Select an event to continue. Everything else stays intact.</p>
              </div>
              <button
                onClick={closeSelector}
                className={`p-2 rounded-full border text-gray-500 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label="Close selector"
                disabled={mustChooseEvent}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20">
              {events.length === 0 ? (
                <div className="h-full min-h-[280px] flex items-center justify-center text-center p-6 bg-white rounded-xl border border-dashed border-primary/20">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-slate-900">No events yet</p>
                    <p className="text-sm text-gray-600">Create your first celebration to unlock the dashboard experience.</p>
                    <Button onClick={openNewForm}>Create an event</Button>
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {events.map((evt) => {
                    const isActive = eventId === evt.id;
                    const isArchived = Boolean(evt?.raw?.isDeleted);
                    const eventDate = evt.date ? new Date(evt.date).toLocaleDateString() : "Date pending";

                    return (
                      <li
                        key={evt.id}
                        role="option"
                        aria-selected={isActive}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelect(evt.id);
                          }
                        }}
                        onClick={() => handleSelect(evt.id)}
                        className={`group relative rounded-xl border transition shadow-sm bg-white cursor-pointer outline-none ${
                          isActive
                            ? "border-primary ring-2 ring-primary/25 shadow-primary/15"
                            : "border-primary/10 hover:border-primary/30 hover:shadow-md focus:ring-2 focus:ring-primary/25"
                        }`}
                      >
                        <div className="absolute right-3 top-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700">
                              <CheckCircleIcon className="w-4 h-4" /> Active
                            </span>
                          ) : isArchived ? (
                            <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700">
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700">
                              Ready
                            </span>
                          )}
                        </div>
                        <div className="px-4 pt-5 pb-4 space-y-2">
                          <h4 className="text-base font-semibold text-slate-900 pr-20 flex items-center gap-2">
                            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-primary"}`} />
                            {evt.title}
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{eventDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <LocationMarkerIcon className="w-4 h-4" />
                              <span>{evt.location || "Add a venue"}</span>
                            </div>
                          </div>
                          {evt.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">{evt.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span className="px-2 py-1 rounded-full bg-accent/70">Tables: {evt.noOfTable ?? "-"}</span>
                            <span className="px-2 py-1 rounded-full bg-accent/70">
                              {isArchived ? "Archived plan" : "Live plan"}
                            </span>
                          </div>
                        </div>
                        <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2">
                          <Button
                            onClick={e => {
                              e.stopPropagation();
                              handleSelect(evt.id);
                            }}
                            className={`flex-1 justify-center ${isActive ? "bg-emerald-600 hover:bg-emerald-500" : ""}`}
                          >
                            {isActive ? "Using this event" : "Use this event"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={e => {
                              e.stopPropagation();
                              openEditForm(evt);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={e => {
                              e.stopPropagation();
                              isArchived ? handleActivate(evt.id) : handleDeactivate(evt.id);
                            }}
                          >
                            {isArchived ? "Activate" : "Archive"}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex flex-wrap gap-3 items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>{mustChooseEvent ? "Choose an event to continue" : "Switch anytime without losing changes"}</span>
              </div>
              <div className="flex gap-2">
                {!mustChooseEvent && (
                  <Button variant="secondary" onClick={closeSelector}>
                    Cancel
                  </Button>
                )}
                <Button onClick={openNewForm}>Create new event</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* nested form modal */}
      <EventFormModal
        isOpen={formOpen}
        initial={editing}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        className="z-70"
      />
    </>
  );
}
