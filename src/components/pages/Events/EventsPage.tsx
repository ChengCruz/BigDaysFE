import { useState } from "react";
import {
  useDeactivateEvent,
  useEventsApi,
  useActivateEvent,
} from "../../../api/hooks/useEventsApi";
import { EventFormModal } from "../../molecules/EventFormModal";
import { Button } from "../../atoms/Button";
import { Outlet, useNavigate } from "react-router-dom";
import { useEventContext } from "../../../context/EventContext";

export default function EventsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: events, isLoading, isError } = useEventsApi(showArchived);
  console.log("EventsPage events:", events, "showArchived:", showArchived);
  const deactivateEvent = useDeactivateEvent();
  const activateEvent = useActivateEvent();
  const [modal, setModal] = useState<{ open: boolean; event?: any }>({
    open: false,
  });
  const navigate = useNavigate();
  const { setEventId, eventId } = useEventContext();

  if (isLoading) return <p>Loading events…</p>;
  if (isError) return <p>Failed to load events.</p>;

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">Your Events</h2>
        <Button onClick={() => setModal({ open: true })}>+ New Event</Button>

        <h1 className="text-primary bg-background">
          Welcome to <span className="text-secondary">My Big Day</span>
        </h1>

        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex items-center space-x-2">
            <label className="text-sm">Show archived</label>
            <Button
              variant={showArchived ? "primary" : "secondary"}
              onClick={() => setShowArchived((s) => !s)}
            >
              {showArchived ? "Hide" : "Show"}
            </Button>
          </div>
        </div>

        <ul className="space-y-2">
          {Array.isArray(events) && events.map((ev: any) => (
              <li
                key={ev.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <h3 className="text-lg font-medium">{ev.title}
                  {ev?.raw?.isDeleted && (
                    <span className="ml-3 inline-block text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                      Archived
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(ev.date).toLocaleDateString()}
                </p>
                <div className="space-x-2">
                  <Button
                    onClick={() => {
                      setEventId(ev.id);
                      navigate("/app/rsvps");
                    }}
                  >
                    {eventId === ev.id ? "✓ Active" : "Select"}
                  </Button>
                  <Button onClick={() => navigate(`${ev.id}/form-fields`)}>
                    Fields
                  </Button>
                  <Button onClick={() => navigate(`${ev.id}/edit`)}>
                    Edit
                  </Button>
                  {ev?.raw?.isDeleted ? (
                    <Button
                      variant="primary"
                      style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                      onClick={() =>
                        activateEvent.mutate(ev.id, {
                          onSuccess: () => console.log("Activated", ev.id),
                        })
                      }
                      disabled={activateEvent.isPending}
                    >
                      {activateEvent.isPending ? "Activating…" : "Activate"}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                      onClick={() =>
                        deactivateEvent.mutate(ev.id, {
                          onSuccess: () => console.log("Deactivated", ev.id),
                        })
                      }
                      disabled={deactivateEvent.isPending}
                    >
                      {deactivateEvent.isPending ? "Deactivating…" : "Deactivate"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
        </ul>

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
