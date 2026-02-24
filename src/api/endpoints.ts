// src/api/endpoints.ts
// NOTE: VITE_API_BASE already includes /api/v1 — do NOT add /v1 here.

export const AuthEndpoints = {
  login: "/User/Login",
  me: "/auth/me",
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
  forEvent: (eventId: string) => `/rsvp/GetRsvp/List/${eventId}`,
  byId: (eventId: string, id: string) => `/events/${eventId}/rsvps/${id}`,
  create: () => `/rsvp/Create`,
  update: () => `/rsvp/Update`,
  delete: () => `/rsvp/Delete`,
};

export const TablesEndpoints = {
  all: (id: string) => `/TableArrangement/Summary/${id}`,
  byId: (id: string) => `/TableArrangement/Summary/${id}`,
  create: "/TableArrangement/Create",
  bulkCreate: "/TableArrangement/BulkCreate",
  update: "/TableArrangement/Update",
  delete: (tableId: string) => `/TableArrangement/Delete/${tableId}`,
  updateLayout: (id: string) => `/tables/${id}/layout`,
  tableGuests: (id: string) => `/tables/${id}/guests`,
  reassignGuest: (tableId: string, guestId: string) =>
    `/tables/${tableId}/guests/${guestId}/reassign`,
};

export const GuestEndpoints = {
  all: (id: string) => `/Guest/ByEvent/${id}`,
  byTable: (tableId: string) => `/Guest/ByTable/${tableId}`,
  assignTable: (guestId: string, tableId: string) => `/Guest/${guestId}/AssignTable/${tableId}`,
  unassignTable: (guestId: string) => `/Guest/${guestId}/UnassignTable`,
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

export const WalletEndpoints = {
  getByEvent: (eventGuid: string) => `/Wallet/GetWalletByEvent/${eventGuid}`,
  getByGuid: (walletGuid: string, eventId: string) => `/Wallet/${walletGuid}?eventId=${eventId}`,
  create: "/Wallet/Create",
  update: "/Wallet/Update",
  delete: "/Wallet/Delete",
  activate: (id: string) => `/Wallet/Activate/${id}`,
  deactivate: (id: string) => `/Wallet/Deactivate/${id}`,
};

export const TransactionEndpoints = {
  getByWallet: (walletGuid: string, eventGuid: string) =>
    `/Transaction/${walletGuid}/transactions?eventGuid=${eventGuid}`,
  getById: (transactionId: string, eventGuid: string) =>
    `/Transaction/${transactionId}?eventGuid=${eventGuid}`,
  create: "/Transaction/Create",
  update: "/Transaction/Update",
  delete: "/Transaction/Delete",
};

export const FormFieldsEndpoints = {
  all: (eventId: string) => `/question/GetQuestions/${eventId}`,
  create: () => `/question/Create`,
  update: () => `/question/Update`,
  activate: () => `/question/Activate`,
  deactivate: () => `/question/Deactivate`,
  delete: (eventId: string, id: string) => `/events/${eventId}/rsvp-form-fields/${id}`,
};

export const PublicRsvpEndpoints = {
  submit: (eventId: string) => `/events/${eventId}/rsvps/public`,
  designByToken: (token: string) => `/RsvpDesign/public/${token}`,
};

export const RsvpDesignEndpoints = {
  get: (eventGuid: string) => `/RsvpDesign/${eventGuid}/design`,
  save: (eventGuid: string) => `/RsvpDesign/${eventGuid}/design`,
  publish: (eventGuid: string, version: number) => `/RsvpDesign/${eventGuid}/design/${version}/publish`,
};

export const DashboardEndpoints = {
  summary: (eventGuid: string) => `/Dashboard/Summary/${eventGuid}`,
};
