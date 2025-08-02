import { useState } from "react";
import { useDeleteEvent, useEventsApi } from "../../../api/hooks/useEventsApi";
import { EventFormModal } from "../../molecules/EventFormModal";
import { Button } from "../../atoms/Button";
import { Outlet, useNavigate } from "react-router-dom";
import { useEventContext } from "../../../context/EventContext";

export default function EventsPage() {
  const { data: events, isLoading, isError } = useEventsApi();
  const deleteEvt = useDeleteEvent();
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

        <ul className="space-y-2">
          {Array.isArray(events) &&
            events.map((ev: any) => (
              <li
                key={ev.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <h3 className="text-lg font-medium">{ev.title}</h3>
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
                  <Button
                    variant="secondary"
                    onClick={() => deleteEvt.mutate(ev.id)}
                  >
                    Delete
                  </Button>
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
