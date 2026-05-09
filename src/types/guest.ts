export interface ApiGuest {
  guestId: string;
  eventId: number;
  eventGuid: string;
  rsvpId?: string;
  tableId?: string | null;
  guestIndex?: number;
  guestCode?: string;
  name: string;
  phoneNo?: string;
  pax?: number;
  groupId?: string;
  seatIndex?: number;
  flag?: string;
  notes?: string;
  createdDate?: string;
  lastUpdated?: string;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
}
