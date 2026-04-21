// src/context/EventContext.tsx
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { useEventsApi, type Event } from "../api/hooks/useEventsApi";
import { AuthContext } from "./AuthProvider";

interface EventContextValue {
  eventId?: string;
  event?: Event;
  events?: Event[];
  eventsLoading: boolean;
  mustChooseEvent: boolean;
  setEventId: (id: string) => void;
}

const EventContext = createContext<EventContextValue>({
  eventId: undefined,
  event: undefined,
  events: [],
  eventsLoading: false,
  mustChooseEvent: false,
  setEventId: () => {},
});

export function EventProvider({ children }: { children: ReactNode }) {
  // Consume AuthContext so this provider re-renders whenever the auth state
  // changes (e.g. after login/token-refresh), which re-enables the events query.
  const { userGuid, loading: authLoading } = useContext(AuthContext);
  const isAuthenticated = !!userGuid;
  const { data: events, isLoading: eventsLoading } = useEventsApi(false, { enabled: isAuthenticated });
  const [eventId, _setEventId] = useState<string | undefined>(
    () => localStorage.getItem("eventId") || undefined
  );

  // Clear stale eventId if events loaded and it doesn't match any known event
  useEffect(() => {
    if (!eventsLoading && events && eventId) {
      const stillExists = events.some((e: Event) => e.id === eventId);
      if (!stillExists) {
        localStorage.removeItem("eventId");
        _setEventId(undefined);
      }
    }
  }, [eventsLoading, events, eventId]);

  // Synchronously resolve the best event when none is stored (e.g. after login).
  // Using useMemo means effectiveEventId is available on the same render that
  // events finish loading — no flash of "no event" or selector modal.
  const autoSelectedId = useMemo((): string | undefined => {
    if (eventId || eventsLoading || !events || events.length === 0) return undefined;
    const now = Date.now();
    const upcoming = events
      .filter(ev => new Date(ev.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (upcoming[0] ?? events[0])?.id;
  }, [eventId, eventsLoading, events]);

  // Persist the auto-selected event to localStorage + state
  useEffect(() => {
    if (!autoSelectedId) return;
    localStorage.setItem("eventId", autoSelectedId);
    _setEventId(autoSelectedId);
  }, [autoSelectedId]);

  // Use the auto-selected id immediately (before the effect persists it)
  const effectiveEventId = eventId ?? autoSelectedId;

  // True only when the user is fully loaded but still has no selectable event
  // (i.e. they have zero events and need to create one).
  const mustChooseEvent = !authLoading && isAuthenticated && !eventsLoading && !effectiveEventId;

  const setEventId = (id: string) => {
    localStorage.setItem("eventId", id);
    _setEventId(id);
  };

  const event = events?.find((e: Event) => e.id === effectiveEventId);

  return (
    <EventContext.Provider
      value={{
        eventId: effectiveEventId,
        event,
        events,
        eventsLoading,
        mustChooseEvent,
        setEventId,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  return useContext(EventContext);
}
