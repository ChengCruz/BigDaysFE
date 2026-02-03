// src/api/endpoints.ts

export const AuthEndpoints = {
  login: "/v1/auth/login", // POST { email, password } → { token, user }
  me: "/v1/auth/me", // GET → { id, name, email, roles… }
};

export const EventsEndpoints = {
  all: "/v1/event/GetEventsList",
  byId: (id: string) => `/v1/event/${id}`,
  create: "/v1/event/Create",
  update: `/v1/event/Update`,
  updateTableQuantity: `/v1/event/UpdateTableQuantity`,
  activateEvent: (id: string) => `/v1/event/Activate/${id}`,
  deactivateEvent: (id: string) => `/v1/event/Deactivate/${id}`,
  previewEvent: `/v1/event/Preview`,
  delete: (id: string) => `/v1/events/${id}`,
  importRsvps: (eventId: string) => `/v1/events/${eventId}/rsvps/import`,
  exportRsvps: (eventId: string) => `/v1/events/${eventId}/rsvps/export`,
};

export const RsvpsEndpoints = {
  all: (eventId: string) => `/v1/rsvp/GetRsvp/List/${eventId}`,
  // byId:   (id: string) => `/rsvps/${id}`,
  // ← add this!  “give me the RSVPs for a specific event”
  forEvent: (eventId: string) => `/v1/rsvp/GetRsvp/List/${eventId}`,
  byId: (eventId: string, id: string) => `/v1/events/${eventId}/rsvps/${id}`,

  create: () => `/v1/rsvp/Create`,
  update: () => `/v1/rsvp/Update`,
  delete: () => `/v1/rsvp/Delete`,
};

// src/api/endpoints.ts
// src/api/endpoints.ts
export const TablesEndpoints = {
 // all: (id:string)=>`/v1/TableArrangement/ByEvent/${id}`,
  all: (id:string)=>`/v1/TableArrangement/Summary/${id}`,
  byId: (id: string) => `/v1/TableArrangement/Summary/${id}`,
  create: "/v1/TableArrangement/Create",
  update: (id: string) => `/v1/TableArrangement/${id}`,
  delete: (tableId: string) => `/v1/TableArrangement/${tableId}`,

  // ← NEW:
  tableGuests: (id: string) => `/v1/tables/${id}/guests`,
  reassignGuest: (tableId: string, guestId: string) =>
    `/v1/tables/${tableId}/guests/${guestId}/reassign`,
};

export const SeatingEndpoints = {
  all: "/v1/seating",
  byId: (id: string) => `/v1/seating/${id}`,
  create: "/v1/seating",
  update: (id: string) => `/v1/seating/${id}`,
  delete: (id: string) => `/v1/seating/${id}`,
};

export const UsersEndpoints = {
  all: "/v1/users",
  byId: (id: string) => `/v1/users/${id}`,
  create: "/v1/users",
  update: (id: string) => `/v1/users/${id}`,
  delete: (id: string) => `/v1/users/${id}`,
};

export const CostingEndpoints = {
  all: "/v1/costing",
  byId: (id: string) => `/v1/costing/${id}`,
  create: "/v1/costing",
  update: (id: string) => `/v1/costing/${id}`,
  delete: (id: string) => `/v1/costing/${id}`,
};

export const FormFieldsEndpoints = {
  all: (eventId: string) => `/v1/question/GetQuestions/${eventId}`,
  create: () => `/v1/question/Create`,
  update: () => `/v1/question/Update`,
    activate: () => `/v1/question/Activate`,
  deactivate: () => `/v1/question/Deactivate`,
  delete: (eventId: string, id: string) =>
    `/v1/events/${eventId}/rsvp-form-fields/${id}`,
};

export const PublicRsvpEndpoints = {
  submit: (eventId: string) => `/v1/events/${eventId}/rsvps/public`,
};
// … later you can add RSVPs, Tables, Seating, Users, Costing, etc.
