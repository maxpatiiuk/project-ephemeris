import React from 'react';

import type { Calendar } from '../lib/dataModel';
import type { RA } from '../lib/types';
import { MARKS_IN_DAY, padNumber, serializeDate } from '../lib/utils';
import { LANGUAGE } from '../localization/utils';
import { className, Container, Link } from './Basic';
import { Column } from './Column';
import { EventsContext } from './Contexts';
import { DAY, WEEK } from './Internationalization';
import { useEvents } from './useEvents';

export function HourTape(): JSX.Element {
  return (
    <div className="flex flex-col text-gray-500">
      <div
        className="flex p-1 border-b border-gray-300 dark:border-neutral-700"
        aria-hidden
      >
        <div className="flex-1 text-left">{'ㅤ'}</div>
        <div className={className.miniCalendarDay}>{'ㅤ'}</div>
      </div>
      {/* A different font is used so that all numbers are equal width */}
      <div className="flex-1 flex flex-col -mb-2 mt-2 text-sm font-[Helvetica,sans-serif]">
        {Array.from({ length: MARKS_IN_DAY - 1 }, (_, index) => (
          <span key={index} className="flex-1 flex items-end">
            {`${padNumber(index + 1)}:00`}
          </span>
        ))}
        <span className="flex-1" />
      </div>
    </div>
  );
}

export function WeekView({
  currentDate,
  enabledCalendars,
  calendars,
}: {
  readonly currentDate: Date;
  readonly enabledCalendars: RA<number>;
  readonly calendars: RA<Calendar> | undefined;
}): JSX.Element {
  const days = React.useMemo(() => {
    const weekDay = currentDate.getDay();
    const newDate = Array.from({ length: WEEK / DAY }, (_, index) => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + index - weekDay);
      return newDate;
    });
    return newDate.map((date) => ({
      date,
      day: date.getDate(),
      weekDay: date.toLocaleString(
        typeof window === 'undefined' ? LANGUAGE : window?.navigator.language,
        {
          weekday: 'short',
        },
      ),
    }));
  }, [currentDate]);

  const eventsRef = React.useContext(EventsContext);
  const events = useEvents(
    days[0].date,
    days.slice(-1)[0].date,
    eventsRef,
    enabledCalendars,
  );

  return (
    <Container.Full className="flex divide-x-2 divide-gray-300 dark:divide-neutral-700">
      <HourTape />
      {days.map(({ date, day, weekDay }, index) => (
        <div key={day} className="flex-1 flex flex-col">
          <Link.Default
            className="flex p-1 border-b border-gray-300 dark:border-neutral-700"
            href={`/view/day/date/${serializeDate(date)}`}
          >
            <div className="flex-1 text-left">{weekDay}</div>
            <div
              className={`${className.miniCalendarDay} ${
                currentDate.getDate() === day
                  ? 'bg-brand-300'
                  : 'bg-brand-100 dark:bg-brand-500'
              }`}
            >
              {day}
            </div>
          </Link.Default>
          <Column
            occurrences={events?.[index]}
            calendars={calendars}
            date={date}
          />
        </div>
      ))}
    </Container.Full>
  );
}
