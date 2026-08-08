export interface ApiEvent {
  eventID: string;
  eventGuid: string;
  /** GUID of the user who owns the event. Only meaningful to admins, who
   *  receive every user's events from GetEventsListByUser. */
  userGuid?: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  noOfTable?: number;
  eventDescription?: string;
  isDeleted?: boolean;
  slug?: string;
  eventCode?: string;
  rsvpDueDate?: string | null;
  isExpired?: boolean;
}
