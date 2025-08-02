// src/context/EventContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { useEventsApi, type Event } from "../api/hooks/useEventsApi";

interface EventContextValue {
  eventId?: string;
  event?: Event;
  events?: Event[];
  isSelectorOpen: boolean;
  setEventId: (id: string) => void;
  openSelector: () => void;
  closeSelector: () => void;
}

const EventContext = createContext<EventContextValue>({
  eventId: undefined,
  event: undefined,
  events: [],
  isSelectorOpen: false,
  setEventId: () => {},
  openSelector: () => {},
  closeSelector: () => {},
});

export function EventProvider({ children }: { children: ReactNode }) {
  const { data: events } = useEventsApi();
  const [eventId, _setEventId] = useState<string | undefined>(
    () => localStorage.getItem("eventId") || undefined
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const setEventId = (id: string) => {
    localStorage.setItem("eventId", id);
    _setEventId(id);
    setIsSelectorOpen(false);
  };
  const openSelector = () => setIsSelectorOpen(true);
  const closeSelector = () => setIsSelectorOpen(false);

  const event = events?.find((e: Event) => e.id === eventId);

  return (
    <EventContext.Provider
      value={{
        eventId,
        event,
        events,
        isSelectorOpen,
        setEventId,
        openSelector,
        closeSelector,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  return useContext(EventContext);
}
