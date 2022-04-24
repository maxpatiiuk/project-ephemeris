import React from 'react';

import type { Calendar } from '../lib/dataModel';
import type { IR, RA } from '../lib/types';
import { className } from './Basic';
import { Column } from './Column';
import { EventsContext } from './Contexts';
import { useEvents } from './useEvents';

export function DayView({
  currentDate,
  enabledCalendars,
  calendars,
}: {
  readonly currentDate: Date;
  readonly enabledCalendars: RA<number>;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const eventsRef = React.useContext(EventsContext);
  const eventOccurrences = useEvents(
    currentDate,
    currentDate,
    eventsRef,
    enabledCalendars
  );
  return (
    <div className="flex-1 border flex flex-col gap-1 overflow-y-scroll">
      <div className="flex gap-1 p-1 border-b">
        <div className="flex-1">
          {currentDate.toLocaleString(window.navigator.language, {
            weekday: 'long',
          })}
        </div>
        <div className={`${className.miniCalendarDay} bg-brand-100`}>
          {currentDate.getDate()}
        </div>
      </div>
      <Column
        occurrences={eventOccurrences?.[0]}
        calendars={calendars}
        date={currentDate}
      />
    </div>
  );
}
