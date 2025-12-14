import { useEffect, useMemo, useState } from "react";
import {
  useDeactivateEvent,
  useEventsApi,
  useActivateEvent,
} from "../../../api/hooks/useEventsApi";
import { EventFormModal } from "../../molecules/EventFormModal";
import { Button } from "../../atoms/Button";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useEventContext } from "../../../context/EventContext";

export default function EventsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: events = [], isLoading, isError } = useEventsApi(showArchived);
  const deactivateEvent = useDeactivateEvent();
  const activateEvent = useActivateEvent();
  const [modal, setModal] = useState<{ open: boolean; event?: any }>({
    open: false,
  });
  const navigate = useNavigate();
  const { setEventId, eventId } = useEventContext();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"upcoming" | "recent" | "name">("upcoming");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const wantsNew = searchParams.get("new") === "1";
    const wantsDemo = searchParams.get("demo") === "1";
    if (wantsNew || wantsDemo) {
      const demoDate = new Date();
      demoDate.setMonth(demoDate.getMonth() + 2);
      const demoEvent = wantsDemo
        ? {
            title: "Sample Summer Wedding",
            date: demoDate.toISOString().slice(0, 10),
            description: "Pre-fill details to see how planning works.",
            location: "Pick your dream venue",
            noOfTable: 12,
          }
        : undefined;

      setModal({ open: true, event: demoEvent });

      const next = new URLSearchParams(searchParams);
      next.delete("new");
      next.delete("demo");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase();
    const list = events.filter((ev) =>
      ev.title.toLowerCase().includes(term) || ev.location?.toLowerCase().includes(term)
    );

    return list.sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      return sortBy === "upcoming" ? aDate - bDate : bDate - aDate;
    });
  }, [events, search, sortBy]);

  const activeCount = events.filter((ev) => !ev.raw?.isDeleted).length;
  const archivedCount = events.filter((ev) => ev.raw?.isDeleted).length;
  const nextEventDate = events.length
    ? new Date(
        Math.min(
          ...events.map((ev) => new Date(ev.date).getTime()).filter((time) => !Number.isNaN(time))
        )
      )
    : undefined;

  if (isLoading) return <p>Loading events…</p>;
  if (isError) return <p>Failed to load events.</p>;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-primary">Your Events</h2>
            <p className="text-sm text-gray-600">Prioritize the next celebration or revisit archived plans.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setModal({ open: true })}>+ New Event</Button>
            <Button
              variant={showArchived ? "primary" : "secondary"}
              onClick={() => setShowArchived((s) => !s)}
            >
              {showArchived ? "Hide" : "Show"} archived
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-white shadow border border-gray-100">
            <p className="text-sm text-gray-500">Active events</p>
            <p className="text-2xl font-semibold text-primary">{activeCount}</p>
          </div>
          <div className="p-4 rounded-lg bg-white shadow border border-gray-100">
            <p className="text-sm text-gray-500">Archived events</p>
            <p className="text-2xl font-semibold text-secondary">{archivedCount}</p>
          </div>
          <div className="p-4 rounded-lg bg-white shadow border border-gray-100">
            <p className="text-sm text-gray-500">Upcoming next</p>
            <p className="text-md text-gray-700">
              {nextEventDate ? nextEventDate.toLocaleDateString() : "Add a date"}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-1 gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location"
              className="w-full border rounded-lg px-3 py-2"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="upcoming">Soonest first</option>
              <option value="recent">Most recent</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
          <div className="hidden lg:block text-right text-sm text-gray-500">
            Welcome to <span className="text-secondary font-semibold">My Big Day</span>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-6 rounded-lg border-2 border-dashed border-gray-200 text-center space-y-2">
            <p className="text-lg font-semibold">No events match your filters.</p>
            <p className="text-sm text-gray-600">Create one to start planning or clear the search.</p>
            <Button onClick={() => setModal({ open: true })}>Create your first event</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredEvents.map((ev) => (
              <li
                key={ev.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{ev.title}</h3>
                      {ev?.raw?.isDeleted && (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(ev.date).toLocaleDateString()} • {ev.location || "Add a venue"}
                    </p>
                    {ev.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{ev.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Tables: {ev.noOfTable ?? "Not set"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setEventId(ev.id);
                        navigate("/app/rsvps");
                      }}
                    >
                      {eventId === ev.id ? "✓ Active" : "Select"}
                    </Button>
                    <Button onClick={() => navigate(`${ev.id}/form-fields`)}>Fields</Button>
                    <Button onClick={() => navigate(`${ev.id}/edit`)}>Edit</Button>
                    {ev?.raw?.isDeleted ? (
                      <Button
                        variant="primary"
                        style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                        onClick={() => activateEvent.mutate(ev.id)}
                        disabled={activateEvent.isPending}
                      >
                        {activateEvent.isPending ? "Activating…" : "Activate"}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                        onClick={() => deactivateEvent.mutate(ev.id)}
                        disabled={deactivateEvent.isPending}
                      >
                        {deactivateEvent.isPending ? "Deactivating…" : "Deactivate"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <EventFormModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false })}
          onSuccess={() => setModal({ open: false })}
          initial={modal.event}
        />
      </div>

      <Outlet />
    </>
  );
}
