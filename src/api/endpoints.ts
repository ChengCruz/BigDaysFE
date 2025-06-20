// src/api/endpoints.ts

export const AuthEndpoints = {
  login: "/auth/login", // POST { email, password } → { token, user }
  me: "/auth/me", // GET → { id, name, email, roles… }
};

export const EventsEndpoints = {
  all:    "/events",
  byId:   (id: string) => `/events/${id}`,
  create: "/events",
  update: (id: string) => `/events/${id}`,
  delete: (id: string) => `/events/${id}`,
  importRsvps: (eventId: string) => `/events/${eventId}/rsvps/import`,
  exportRsvps: (eventId: string) => `/events/${eventId}/rsvps/export`,
};

export const RsvpsEndpoints = {
  all:    "/rsvps",
  byId:   (id: string) => `/rsvps/${id}`,
  create: "/rsvps",
  update: (id: string) => `/rsvps/${id}`,
  delete: (id: string) => `/rsvps/${id}`,
};

export const TablesEndpoints = {
  all:    "/tables",
  byId:   (id: string) => `/tables/${id}`,
  create: "/tables",
  update: (id: string) => `/tables/${id}`,
  delete: (id: string) => `/tables/${id}`,
};

export const SeatingEndpoints = {
  all:    "/seating",
  byId:   (id: string) => `/seating/${id}`,
  create: "/seating",
  update: (id: string) => `/seating/${id}`,
  delete: (id: string) => `/seating/${id}`,
};

export const UsersEndpoints = {
  all:    "/users",
  byId:   (id: string) => `/users/${id}`,
  create: "/users",
  update: (id: string) => `/users/${id}`,
  delete: (id: string) => `/users/${id}`,
};

export const CostingEndpoints = {
  all:    "/costing",
  byId:   (id: string) => `/costing/${id}`,
  create: "/costing",
  update: (id: string) => `/costing/${id}`,
  delete: (id: string) => `/costing/${id}`,
};

export const FormFieldsEndpoints = {
  all:    (eventId: string) => `/events/${eventId}/rsvp-form-fields`,
  byId:   (eventId: string, id: string) => `/events/${eventId}/rsvp-form-fields/${id}`,
  create: (eventId: string) => `/events/${eventId}/rsvp-form-fields`,
  update: (eventId: string, id: string) => `/events/${eventId}/rsvp-form-fields/${id}`,
  delete: (eventId: string, id: string) => `/events/${eventId}/rsvp-form-fields/${id}`,
};

export const PublicRsvpEndpoints = {
  submit: (eventId: string) => `/events/${eventId}/rsvps/public`
};
// … later you can add RSVPs, Tables, Seating, Users, Costing, etc.
