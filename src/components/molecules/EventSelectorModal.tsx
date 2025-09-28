import { useState } from "react";
import { XIcon } from "@heroicons/react/outline";
import { useEventContext } from "../../context/EventContext";
import { useDeactivateEvent, type Event } from "../../api/hooks/useEventsApi";
import { Button } from "../atoms/Button";
import { EventFormModal } from "./EventFormModal";

export function EventSelectorModal() {
  const {
    isSelectorOpen,
    events = [],
    setEventId,
    closeSelector,
  } = useEventContext();
  const deactivateEvent = useDeactivateEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Event | undefined>(undefined);

  if (!isSelectorOpen) return null;

  const handleSelect = (id: string) => {
    setEventId(id);
    // keep selector open so user sees which one is active
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

  const handleFormClose = () => setFormOpen(false);

  const handleFormSuccess = (evt: Event) => {
    setEventId(evt.id);
    setFormOpen(false);
    // selector remains open
  };

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={closeSelector}
      />

      {/* selector panel */}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-background w-full max-w-2xl h-[80vh] rounded-lg shadow-lg flex flex-col overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Select Event</h2>
            <button
              onClick={closeSelector}
              className="p-2 rounded hover:bg-secondary/10"
              aria-label="Close selector"
            >
              <XIcon className="h-5 w-5 text-text" />
            </button>
          </div>

          {/* event list */}
          <ul className="flex-1 overflow-y-auto px-6 py-4 space-y-2 scrollbar-thin scrollbar-thumb-secondary/50">
            {events.map((evt) => (
              <li
                key={evt.id}
                className="flex items-center justify-between px-4 py-2 rounded hover:bg-secondary/10 transition"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => handleSelect(evt.id)}
                >
                  {evt.title} — {new Date(evt.date).toLocaleDateString()}
                </button>
                <div className="flex space-x-2">
                  <Button variant="secondary" onClick={() => openEditForm(evt)}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => handleDeactivate(evt.id)}>
                    Deactivate
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {/* footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-2">
            <Button variant="secondary" onClick={closeSelector}>
              Cancel
            </Button>
            <Button onClick={openNewForm}>New Event</Button>
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
