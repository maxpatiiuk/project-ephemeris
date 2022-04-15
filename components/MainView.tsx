import { useRouter } from 'next/router';
import React from 'react';

import type { EventOccurrence, EventTable } from '../lib/datamodel';
import { f } from '../lib/functools';
import type { R, RA } from '../lib/types';
import type { View } from '../pages/view/[view]/date/[date]/[[...occurrenceId]]';
import { CalendarsContext, EventsContext } from './Contexts';
import { DayView } from './DayView';
import { MiniEvent } from './MiniEvent';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';

export type EventsRef = React.MutableRefObject<{
  readonly events: R<EventTable>;
  readonly eventOccurrences: R<R<EventOccurrence>>;
}>;

export function MainView({
  view,
  date,
  enabledCalendars,
}: {
  readonly view: View;
  readonly date: Date;
  readonly enabledCalendars: RA<number>;
}): JSX.Element {
  const calendars = React.useContext(CalendarsContext);
  const eventsRef = React.useContext(EventsContext);
  const router = useRouter();
  const currentOccurrenceId = f.parseInt(router.query.occurrenceId?.[1] ?? '');
  const currentOccurrence =
    eventsRef.current.eventOccurrences[
      (router.query.date as string | undefined) ?? ''
    ]?.[currentOccurrenceId ?? ''];
  return (
    <>
      {view === 'year' ? (
        <YearView currentDate={date} />
      ) : view === 'month' ? (
        <MonthView currentDate={date} />
      ) : view === 'week' ? (
        <WeekView
          currentDate={date}
          enabledCalendars={enabledCalendars}
          calendars={calendars}
        />
      ) : (
        <DayView
          currentDate={date}
          enabledCalendars={enabledCalendars}
          calendars={calendars}
        />
      )}
      {typeof currentOccurrence === 'object' && (
        <MiniEvent occurrence={currentOccurrence} calendars={calendars} />
      )}
    </>
  );
}
