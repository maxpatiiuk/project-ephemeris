import React from 'react';

import type { Calendar } from '../lib/datamodel';
import type { IR, RA } from '../lib/types';
import { MARKS_IN_DAY, padNumber, serializeDate } from '../lib/utils';
import { LANGUAGE } from '../localization/utils';
import { className, Link } from './Basic';
import { Column } from './Column';
import { EventsContext } from './Contexts';
import { DAYS_IN_WEEK } from './MiniCalendar';
import { useEvents } from './useEvents';

export function WeekView({
  currentDate,
  enabledCalendars,
  calendars,
}: {
  readonly currentDate: Date;
  readonly enabledCalendars: RA<number>;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const days = React.useMemo(() => {
    const weekDay = currentDate.getDay();
    const newDate = Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
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
        }
      ),
    }));
  }, [currentDate]);

  const eventsRef = React.useContext(EventsContext);
  const events = useEvents(
    days[0].date,
    days.slice(-1)[0].date,
    eventsRef,
    enabledCalendars
  );

  return (
    <div className="flex border divide-x-2 rounded">
      <div className="flex flex-col text-gray-500">
        <div className="flex p-1 border-b" aria-hidden>
          <div className="flex-1 text-left">{'ㅤ'}</div>
          <div className={className.miniCalendarDay}>{'ㅤ'}</div>
        </div>
        {Array.from({ length: MARKS_IN_DAY }, (_, index) => (
          <span
            key={index}
            className="border-b border-gray-200 dark:border-neutral-900 flex-1 flex items-end"
          >
            {`${padNumber(index + 1)}:00`}
          </span>
        ))}
      </div>
      {days.map(({ date, day, weekDay }, index) => (
        <div key={day} className="flex-1 flex flex-col">
          <Link.Default
            className="flex p-1 border-b"
            href={`/view/day/date/${serializeDate(date)}`}
          >
            <div className="flex-1 text-left">{weekDay}</div>
            <div
              className={`${className.miniCalendarDay} ${
                currentDate.getDate() === day ? 'bg-brand-300' : 'bg-brand-100'
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
    </div>
  );
}
