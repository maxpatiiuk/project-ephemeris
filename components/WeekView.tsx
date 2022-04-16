import React from 'react';

import type { Calendar } from '../lib/datamodel';
import type { IR, RA } from '../lib/types';
import { serializeDate } from '../lib/utils';
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
      {days.map(({ date, day, weekDay }, index) => (
        <div key={day} className="flex-1 flex flex-col gap-1">
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
