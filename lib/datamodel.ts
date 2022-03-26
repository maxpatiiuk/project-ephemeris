const number = 0;
const string = '';
const boolean = 0;
const date = new Date();
const time = new Date();

export const calendar = {
  id: number,
  name: string,
  description: string,
  color: string,
  isEnabled: boolean,
};

export type Calendar = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly isEnabled: 1 | 0;
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

export type Event = {
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
  Event: Event;
  EventOccurrence: EventOccurrence;
};
