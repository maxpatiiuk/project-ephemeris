import React from 'react';

import type { Calendar } from '../lib/datamodel';
import type { IR, RA } from '../lib/types';
import { className } from './Basic';
import { Column } from './Column';
import type { EventsRef } from './MainView';
import { useEvents } from './useEvents';

export function DayView({
  currentDate,
  enabledCalendars,
  eventsRef,
  calendars,
}: {
  readonly currentDate: Date;
  readonly enabledCalendars: RA<number>;
  readonly eventsRef: EventsRef;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const eventOccurrences = useEvents(
    currentDate,
    currentDate,
    eventsRef,
    enabledCalendars
  );
  return (
    <div className="flex-1 border flex flex-col gap-1">
      <div className="flex gap-1 p-1 border-b">
        <div className="flex-1">
          {currentDate.toLocaleString(window.navigator.language, {
            weekday: 'long',
          })}
        </div>
        <div className={`${className.miniCalendarDay} bg-brand-100`}>
          {currentDate.getDate()}
        </div>
        <Column occurrences={eventOccurrences?.[0]} calendars={calendars} />
      </div>
    </div>
  );
}
