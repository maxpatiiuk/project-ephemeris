import React from 'react';

import type { Calendar } from '../lib/dataModel';
import type { RA } from '../lib/types';
import { className, Container } from './Basic';
import { Column } from './Column';
import { EventsContext } from './Contexts';
import { useEvents } from './useEvents';
import { HourTape } from './WeekView';

export function DayView({
  currentDate,
  enabledCalendars,
  calendars,
}: {
  readonly currentDate: Date;
  readonly enabledCalendars: RA<number>;
  readonly calendars: RA<Calendar> | undefined;
}): JSX.Element {
  const eventsRef = React.useContext(EventsContext);
  const eventOccurrences = useEvents(
    currentDate,
    currentDate,
    eventsRef,
    enabledCalendars
  );
  return (
    <Container.Full className="flex-1  flex">
      <HourTape />
      <div
        className={`flex-1 border-l border-gray-300 dark:border-neutral-700
          flex flex-col gap-1 overflow-y-scroll`}
      >
        <div className="flex gap-1 p-1 border-b border-gray-300 dark:border-neutral-700">
          <div className="flex-1">
            {currentDate.toLocaleString(window.navigator.language, {
              weekday: 'long',
            })}
          </div>
          <div
            className={`${className.miniCalendarDay} bg-brand-100 dark:brand-500`}
          >
            {currentDate.getDate()}
          </div>
          <span className="flex-1" />
        </div>
        <Column
          occurrences={eventOccurrences?.[0]}
          calendars={calendars}
          date={currentDate}
        />
      </div>
    </Container.Full>
  );
}
