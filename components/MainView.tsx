import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar, EventOccurrence, EventTable } from '../lib/dataModel';
import type { eventTarget } from '../lib/events';
import { f } from '../lib/functools';
import type { R, RA } from '../lib/types';
import {
  DEFAULT_EVENT_DURATION,
  DEFAULT_MINUTE_ROUNDING,
  deserializeDate,
  parseReTime,
} from '../lib/utils';
import type { View } from '../pages/view/[view]/date/[date]/[[...occurrenceId]]';
import { EventsContext } from './Contexts';
import { DayView } from './DayView';
import { MiniEvent } from './MiniEvent';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';

export type EventsRef = React.MutableRefObject<{
  readonly events: R<EventTable>;
  readonly eventOccurrences: R<R<EventOccurrence>>;
  readonly eventTarget: ReturnType<typeof eventTarget>;
}>;

export function MainView({
  view,
  date,
  enabledCalendars,
  calendars,
}: {
  readonly view: View;
  readonly date: Date;
  readonly enabledCalendars: RA<number>;
  readonly calendars: RA<Calendar> | undefined;
}): JSX.Element {
  const eventsRef = React.useContext(EventsContext);
  const router = useRouter();
  const currentOccurrenceId = f.parseInt(router.query.occurrenceId?.[1] ?? '');
  const currentOccurrence = React.useMemo(() => {
    if (router.query.occurrenceId?.[1] === 'add') {
      const startDate = deserializeDate((router.query.date as string) ?? '');
      const parsedTime =
        typeof router.query.start === 'string'
          ? parseReTime(router.query.start)
          : undefined;
      if (Array.isArray(parsedTime)) {
        const [hour, minute] = parsedTime;
        startDate.setHours(hour);
        startDate.setMinutes(minute);
      } else {
        const currentDate = new Date();
        startDate.setHours(currentDate.getHours());
        startDate.setMinutes(
          f.ceil(currentDate.getMinutes(), DEFAULT_MINUTE_ROUNDING),
        );
      }
      return {
        id: undefined,
        name: '',
        description: '',
        startDateTime: startDate,
        endDateTime: new Date(startDate.getTime() + DEFAULT_EVENT_DURATION),
        color: calendars?.[0]?.color ?? '#123abc',
        eventId: undefined,
      };
    } else
      return eventsRef.current.eventOccurrences[
        (router.query.date as string | undefined) ?? ''
      ]?.[currentOccurrenceId ?? ''];
  }, [
    calendars,
    eventsRef,
    currentOccurrenceId,
    router.query.occurrenceId,
    router.query.date,
    router.query.start,
  ]);

  return (
    <>
      {view === 'year' ? (
        <YearView currentDate={date} />
      ) : view === 'month' ? (
        <MonthView
          currentDate={date}
          enabledCalendars={enabledCalendars}
          eventsRef={eventsRef}
          calendars={calendars}
        />
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
        <MiniEvent
          key={currentOccurrence.id}
          occurrence={currentOccurrence}
          calendars={calendars}
        />
      )}
    </>
  );
}
