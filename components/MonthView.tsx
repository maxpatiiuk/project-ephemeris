import BaseLink from 'next/link';
import React from 'react';

import type { Calendar } from '../lib/dataModel';
import type { IR, RA } from '../lib/types';
import { getMonthDays, serializeDate, startWithSunday } from '../lib/utils';
import { globalText } from '../localization/global';
import { className, Container, Link } from './Basic';
import type { EventsRef } from './MainView';
import type { OccurrenceWithEvent } from './useEvents';
import { useEvents } from './useEvents';

function DayEvents({
  occurrences,
  calendars,
}: {
  readonly occurrences: RA<OccurrenceWithEvent> | undefined;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  return (
    <div className={`flex-1 flex flex-col overflow-auto`}>
      {occurrences?.map(
        ({
          id,
          name,
          startDateTime,
          endDateTime,
          color,
          event: { calendarId },
        }) => (
          <BaseLink
            href={`/view/day/date/${serializeDate(startDateTime)}/event/${id}`}
            key={id}
          >
            <a
              style={{
                backgroundColor: color,
                borderColor: calendars?.[calendarId].color ?? color,
              }}
              className={`flex flex-col rounded p-1 !border-l-2
                hover:brightness-150 z-10
                ${endDateTime.getTime() < Date.now() ? 'brightness-80' : ''}`}
            >
              {name}
            </a>
          </BaseLink>
        )
      )}
    </div>
  );
}

export function MonthView({
  currentDate,
  eventsRef,
  enabledCalendars,
  calendars,
}: {
  readonly currentDate: Date;
  readonly eventsRef: EventsRef;
  readonly enabledCalendars: RA<number>;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const days = React.useMemo(() => getMonthDays(currentDate), [currentDate]);
  const eventOccurrences = useEvents(
    days.previousMonth[0]?.[1] ?? days.currentMonth[0][1],
    days.nextMonth.slice(-1)[0]?.[1] ?? days.currentMonth.slice(-1)[0][1],
    eventsRef,
    enabledCalendars
  );
  return (
    <Container.Full className="flex flex-col overflow-hidden">
      <div className="flex">
        {(startWithSunday
          ? globalText('daysOfWeek')
          : globalText('daysOfWeekEurope')
        )
          .split('')
          .map((dayOfWeek, index) => (
            <div
              key={index}
              className={`${className.miniCalendarDay} text-gray-500 w-full`}
            >
              {dayOfWeek}
            </div>
          ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {days.previousMonth.map(([label, date], index) => (
          <div
            className="border border-gray-300 dark:border-neutral-700 flex flex-col gap-1"
            key={label}
          >
            <div className="flex justify-center">
              <Link.Default
                className={`${className.miniCalendarDay} text-gray-500`}
                href={`/view/week/date/${serializeDate(date)}`}
              >
                {label}
              </Link.Default>
            </div>
            <DayEvents
              occurrences={eventOccurrences?.[index]}
              calendars={calendars}
            />
          </div>
        ))}
        {days.currentMonth.map(([label, date], index) => (
          <div
            className="border border-gray-300 dark:border-neutral-700 flex flex-col gap-1"
            key={label}
          >
            <div className="flex justify-center">
              <Link.Default
                className={`${className.miniCalendarDay}  ${
                  days.todayDay === label ? 'bg-brand-300' : ''
                }`}
                href={`/view/week/date/${serializeDate(date)}`}
              >
                {label}
              </Link.Default>
            </div>
            <DayEvents
              occurrences={
                eventOccurrences?.[days.previousMonth.length + index]
              }
              calendars={calendars}
            />
          </div>
        ))}
        {days.nextMonth.map(([label, date], index) => (
          <div
            className="border border-gray-300 dark:border-neutral-700 flex flex-col gap-1"
            key={label}
          >
            <div className="flex justify-center">
              <Link.Default
                className={`${className.miniCalendarDay} text-gray-500`}
                href={`/view/week/date/${serializeDate(date)}`}
              >
                {label}
              </Link.Default>
            </div>
            <DayEvents
              occurrences={
                eventOccurrences?.[
                  days.previousMonth.length + days.currentMonth.length + index
                ]
              }
              calendars={calendars}
            />
          </div>
        ))}
      </div>
    </Container.Full>
  );
}
