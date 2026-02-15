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
  bulkCreate: "/v1/TableArrangement/BulkCreate",
  update: "/v1/TableArrangement/Update",  // For table info & assignments
  delete: (tableId: string) => `/v1/TableArrangement/Delete/${tableId}`,
  
  // Table Layout Module (separate API)
  updateLayout: (id: string) => `/v1/tables/${id}/layout`,  // Different module/API

  // ← NEW:
  tableGuests: (id: string) => `/v1/tables/${id}/guests`,
  reassignGuest: (tableId: string, guestId: string) =>
    `/v1/tables/${tableId}/guests/${guestId}/reassign`,
};

export const GuestEndpoints = {
  all: (id:string)=>`/v1/Guest/ByEvent/${id}`,
  byTable: (tableId: string)=>`/v1/Guest/ByTable/${tableId}`,
  assignTable: (guestId: string, tableId: string) => `/v1/Guest/${guestId}/AssignTable/${tableId}`,
  unassignTable: (guestId: string) => `/v1/Guest/${guestId}/UnassignTable`,
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

export const WalletEndpoints = {
  getByEvent: (eventGuid: string) => `/v1/Wallet/GetWalletByEvent/${eventGuid}`,
  getByGuid: (walletGuid: string, eventId: string) => `/v1/Wallet/${walletGuid}?eventId=${eventId}`,
  create: "/v1/Wallet/Create",
  update: "/v1/Wallet/Update",
  delete: "/v1/Wallet/Delete",
  activate: (id: string) => `/v1/Wallet/Activate/${id}`,
  deactivate: (id: string) => `/v1/Wallet/Deactivate/${id}`,
};

export const TransactionEndpoints = {
  getByWallet: (walletGuid: string, eventGuid: string) => 
    `/v1/Transaction/${walletGuid}/transactions?eventGuid=${eventGuid}`,
  getById: (transactionId: string, eventGuid: string) => 
    `/v1/Transaction/${transactionId}?eventGuid=${eventGuid}`,
  create: "/v1/Transaction/Create",
  update: "/v1/Transaction/Update",
  delete: "/v1/Transaction/Delete",
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

export const RsvpDesignEndpoints = {
  get: (eventGuid: string) => `/v1/RsvpDesign/${eventGuid}/design`,
  save: (eventGuid: string) => `/v1/RsvpDesign/${eventGuid}/design`,
  publish: (eventGuid: string, version: number) => `/v1/RsvpDesign/${eventGuid}/design/${version}/publish`,
};

export const DashboardEndpoints = {
  summary: (eventGuid: string) => `/v1/Dashboard/Summary/${eventGuid}`,
};
