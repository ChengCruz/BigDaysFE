// src/api/endpoints.ts

export const AuthEndpoints = {
  login: "/auth/login", // POST { email, password } → { token, user }
  me: "/auth/me", // GET → { id, name, email, roles… }
};

export const EventsEndpoints = {
  all: "/event/GetEventsList",
  byId: (id: string) => `/event/${id}`,
  create: "/event/Create",
  update: `/event/Update`,
  updateTableQuantity: `/event/UpdateTableQuantity`,
  activateEvent: (id: string) => `/event/Activate/${id}`,
  deactivateEvent: (id: string) => `/event/Deactivate/${id}`,
  previewEvent: `/event/Preview`,
  delete: (id: string) => `/events/${id}`,
  importRsvps: (eventId: string) => `/events/${eventId}/rsvps/import`,
  exportRsvps: (eventId: string) => `/events/${eventId}/rsvps/export`,
};

export const RsvpsEndpoints = {
  all: (eventId: string) => `/rsvp/GetRsvp/List/${eventId}`,
  // byId:   (id: string) => `/rsvps/${id}`,
  // ← add this!  “give me the RSVPs for a specific event”
  forEvent: (eventId: string) => `/rsvp/GetRsvp/List/${eventId}`,
  byId: (eventId: string, id: string) => `/events/${eventId}/rsvps/${id}`,

  create: () => `/rsvp/Create`,
  update: () => `/rsvp/Update`,
  delete: () => `/rsvp/Delete`,
};

// src/api/endpoints.ts
// src/api/endpoints.ts
export const TablesEndpoints = {
  all: "/tables",
  byId: (id: string) => `/tables/${id}`,
  create: "/tables",
  update: (id: string) => `/tables/${id}`,
  delete: (id: string) => `/tables/${id}`,

  // ← NEW:
  tableGuests: (id: string) => `/tables/${id}/guests`,
  reassignGuest: (tableId: string, guestId: string) =>
    `/tables/${tableId}/guests/${guestId}/reassign`,
};

export const SeatingEndpoints = {
  all: "/seating",
  byId: (id: string) => `/seating/${id}`,
  create: "/seating",
  update: (id: string) => `/seating/${id}`,
  delete: (id: string) => `/seating/${id}`,
};

export const UsersEndpoints = {
  all: "/users",
  byId: (id: string) => `/users/${id}`,
  create: "/users",
  update: (id: string) => `/users/${id}`,
  delete: (id: string) => `/users/${id}`,
};

export const CostingEndpoints = {
  all: "/costing",
  byId: (id: string) => `/costing/${id}`,
  create: "/costing",
  update: (id: string) => `/costing/${id}`,
  delete: (id: string) => `/costing/${id}`,
};

export const FormFieldsEndpoints = {
  all: (eventId: string) => `/question/GetQuestions/${eventId}`,
  create: () => `/question/Create`,
  update: () => `/question/Update`,
    activate: () => `/question/Activate`,
  deactivate: () => `/question/Deactivate`,
  delete: (eventId: string, id: string) =>
    `/events/${eventId}/rsvp-form-fields/${id}`,
};

export const PublicRsvpEndpoints = {
  submit: (eventId: string) => `/events/${eventId}/rsvps/public`,
};
// … later you can add RSVPs, Tables, Seating, Users, Costing, etc.
