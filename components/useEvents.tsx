import React from 'react';

import { ajax } from '../lib/ajax';
import type { EventOccurrence, EventTable } from '../lib/datamodel';
import { f } from '../lib/functools';
import { sortFunction } from '../lib/helpers';
import { formatUrl } from '../lib/querystring';
import type { RA } from '../lib/types';
import { serializeDate } from '../lib/utils';
import { useAsyncState } from './Hooks';
import { DAY, MILLISECONDS } from './Internationalization';
import type { EventsRef } from './MainView';

export type OccurrenceWithEvent = EventOccurrence & {
  readonly event: EventTable;
};

function treatAsUtc(date: Date): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
}

const MILLISECONDS_IN_DAY = MILLISECONDS * DAY;

export const getDaysBetween = (startDate: Date, endDate: Date): number =>
  Math.round(
    (treatAsUtc(endDate).getTime() - treatAsUtc(startDate).getTime()) /
      MILLISECONDS_IN_DAY
  );

export const getDatesBetween = (startDate: Date, endDate: Date): RA<string> =>
  Array.from(
    {
      length: getDaysBetween(startDate, endDate) + 1,
    },
    (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return serializeDate(date);
    }
  );

const fetchEventOccurrences = async (
  startDate: Date,
  endDate: Date,
  eventsRef: EventsRef
): Promise<void> =>
  f.var(getDatesBetween(startDate, endDate), (dates) =>
    dates.every(
      (dateNumber) => dateNumber in eventsRef.current.eventOccurrences
    )
      ? undefined
      : ajax<RA<EventOccurrence>>(
          formatUrl('/api/table/eventOccurrence', {
            startDateTime_greaterEqual: new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            ).toJSON(),
            startDateTime_less: new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate() + 1
            ).toJSON(),
          }),
          {
            headers: { Accept: 'application/json' },
          }
        ).then(async ({ data: occurrences }) =>
          Promise.all(
            f
              .unique(occurrences.map(({ eventId }) => eventId))
              .filter(
                (eventId) =>
                  typeof eventsRef.current.events[eventId] === 'undefined'
              )
              .map(async (eventId) =>
                ajax<EventTable>(`/api/table/event/${eventId}`, {
                  headers: { Accept: 'application/json' },
                }).then(({ data }) => {
                  eventsRef.current.events[data.id] = {
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                  };
                })
              )
          ).then((): void => {
            dates.forEach((dateNumber) => {
              eventsRef.current.eventOccurrences[dateNumber] ??= {};
            });
            occurrences.forEach((occurrence) => {
              const startDateTime = new Date(occurrence.startDateTime);
              const endDateTime = new Date(occurrence.endDateTime);
              eventsRef.current.eventOccurrences[serializeDate(startDateTime)][
                occurrence.id
              ] = {
                ...occurrence,
                startDateTime,
                endDateTime,
              };
            });
          })
        )
  );

function useUpdates(eventTarget: EventTarget): number {
  const [version, setVersion] = React.useState<number>(0);
  React.useEffect(() => {
    const handleChange = (): void => setVersion((version) => version + 1);
    eventTarget.addEventListener('change', handleChange);
    return (): void => eventTarget.removeEventListener('change', handleChange);
  }, [eventTarget]);
  return version;
}

/**
 * A hook to get an array of occurrences for each day between dates
 */
export function useEvents(
  startDate: Date,
  endDate: Date,
  eventsRef: EventsRef,
  enabledCalendars: RA<number> | undefined
): RA<RA<OccurrenceWithEvent>> | undefined {
  const version = useUpdates(eventsRef.current.eventTarget);

  const [eventOccurrences] = useAsyncState<RA<RA<OccurrenceWithEvent>>>(
    React.useCallback(
      async () =>
        fetchEventOccurrences(startDate, endDate, eventsRef).then(async () =>
          getDatesBetween(startDate, endDate).map((dateNumber) =>
            Object.values(eventsRef.current.eventOccurrences[dateNumber])
              .map((occurrence) => ({
                ...occurrence,
                event: eventsRef.current.events[occurrence.eventId],
              }))
              .sort(
                sortFunction(({ startDateTime }) => startDateTime.getTime())
              )
          )
        ),
      // Version is used to force recalculate events for a given day
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [eventsRef, startDate, endDate, version]
    ),
    false
  );
  return React.useMemo(
    () =>
      eventOccurrences?.map((occurrences) =>
        occurrences.filter(
          ({ event }) => enabledCalendars?.includes(event.calendarId) !== false
        )
      ),
    [eventOccurrences, enabledCalendars]
  );
}
