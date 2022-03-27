import React from 'react';

import { ajax } from '../lib/ajax';
import type { EventOccurrence, EventTable } from '../lib/datamodel';
import { f } from '../lib/functools';
import { formatUrl } from '../lib/querystring';
import type { RA } from '../lib/types';
import { defined } from '../lib/types';
import { useAsyncState } from './Hooks';
import type { EventsRef } from './MainView';

type OccurrenceWithEvent = EventOccurrence & {
  readonly event: EventTable;
};

export function useEvents(
  startDate: Date,
  endDate: Date,
  eventsRef: EventsRef,
  enabledCalendars: RA<number>
): RA<OccurrenceWithEvent> | undefined {
  const [eventOccurrences] = useAsyncState<RA<OccurrenceWithEvent>>(
    React.useCallback(
      async () =>
        ajax<RA<EventOccurrence>>(
          formatUrl('/api/table/eventOccurrence/', {
            startDate_greaterEqual: new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            ).toJSON(),
            startDate_smaller: new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate()
            ).toJSON(),
          }),
          {
            headers: { Accept: 'application/json' },
          }
        ).then(async ({ data }) =>
          fetchEvents(eventsRef, data).then(async () =>
            Promise.all(
              data.map(async (occurrence) => ({
                ...occurrence,
                event: await defined(eventsRef.current[occurrence.eventId]),
              }))
            )
          )
        ),
      [startDate, endDate]
    ),
    false
  );

  return React.useMemo(
    () =>
      eventOccurrences?.filter(({ event }) =>
        enabledCalendars.includes(event.calendarId)
      ),
    [eventOccurrences, enabledCalendars]
  );
}

const fetchEvents = async (
  eventsRef: EventsRef,
  occurrences: RA<EventOccurrence>
): Promise<void> =>
  Promise.all(
    occurrences
      .map(({ eventId }) => eventId)
      .filter((eventId) => typeof eventsRef.current[eventId] === 'undefined')
      .map((eventId) => {
        eventsRef.current[eventId] = ajax<EventTable>(
          `/api/table/event/${eventId}`,
          {
            headers: { Accept: 'application/json' },
          }
        ).then(({ data }) => data);
      })
  ).then(f.void);
