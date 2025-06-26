// src/context/EventContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from "react";

interface EventContextValue {
  eventId?: string;
  setEventId: (id: string) => void;
}

const EventContext = createContext<EventContextValue>({
  eventId: undefined,
  setEventId: () => {},
});

export function EventProvider({ children }: { children: ReactNode }) {
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  return (
    <EventContext.Provider value={{ eventId, setEventId }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  return useContext(EventContext);
}
