export interface ApiEvent {
  eventID: string;
  eventGuid: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  noOfTable?: number;
  eventDescription?: string;
  isDeleted?: boolean;
  slug?: string;
}
