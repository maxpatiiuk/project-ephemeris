const number = 0;
const string = '';
const date = new Date();
const time = new Date();

export type New<TABLE extends Table[keyof Table]> =
  | TABLE
  | (Omit<TABLE, 'id'> & {
      readonly id: number | undefined;
    });

export const calendar = {
  id: number,
  name: string,
  description: string,
  color: string,
};

export type Calendar = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly color: string;
};

export const event = {
  id: number,
  startDate: date,
  endDate: date,
  defaultStartTime: time,
  defaultEndTime: time,
  daysOfWeek: string,
  defaultColor: string,
  calendarId: number,
};

// Called EventTable rather than Event as Event is a global TypeScript type
export type EventTable = {
  id: number;
  startDate: Date;
  endDate: Date;
  defaultStartTime: Date;
  defaultEndTime: Date;
  daysOfWeek: string;
  defaultColor: string;
  calendarId: number;
};

export const eventOccurrence = {
  id: number,
  name: string,
  description: string,
  startDateTime: date,
  endDateTime: date,
  color: string,
  eventId: number,
};

export type EventOccurrence = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly startDateTime: Date;
  readonly endDateTime: Date;
  readonly color: string;
  readonly eventId: number;
};

export const tables = {
  calendar,
  event,
  eventOccurrence,
};

export type Table = {
  Calendar: Calendar;
  Event: EventTable;
  EventOccurrence: EventOccurrence;
};
