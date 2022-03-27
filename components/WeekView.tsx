import React from 'react';

import type { RA } from '../lib/types';
import { LANGUAGE } from '../localization/utils';
import { className } from './Basic';
import { Column } from './Column';
import type { EventsRef } from './MainView';
import { DAYS_IN_WEEK } from './MiniCalendar';
import { useEvents } from './useEvents';

export function WeekView({
  currentDate,
  onDateSelect: handleDateSelect,
  enabledCalendars,
  eventsRef,
}: {
  readonly currentDate: Date;
  readonly onDateSelect: (newDate: Date) => void;
  readonly enabledCalendars: RA<number>;
  readonly eventsRef: EventsRef;
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

  const [events] = useEvents(
    days[0].date,
    days.slice(-1)[0].date,
    eventsRef,
    enabledCalendars
  );

  return (
    <div className="flex border">
      {days.map(({ date, day, weekDay }) => (
        <div key={day} className="flex-1 border flex flex-col gap-1">
          <button
            type="button"
            className="flex gap-1 p-1 border-b"
            onClick={(): void => handleDateSelect(date)}
          >
            <div className="flex-1 text-left">{weekDay}</div>
            <div
              className={`${className.miniCalendarDay} ${
                currentDate.getDate() === day ? 'bg-brand-300' : 'bg-brand-100'
              }`}
            >
              {day}
            </div>
          </button>
          <Column date={date} enabledCalendars={enabledCalendars} />
        </div>
      ))}
    </div>
  );
}
