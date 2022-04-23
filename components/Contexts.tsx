import React from 'react';
import Modal from 'react-modal';

import { ajax } from '../lib/ajax';
import { error } from '../lib/assert';
import type { Calendar } from '../lib/datamodel';
import type { IR, RA } from '../lib/types';
import { crash } from './ErrorBoundary';
import { useAsyncState, useBooleanState } from './Hooks';
import type { EventsRef } from './MainView';
import { LoadingScreen } from './ModalDialog';

/*
 * Exposing component's setError callback to the outside so that an error
 * can be summoned outside of React code
 */
let exposedSetError: (errorElement: JSX.Element | undefined) => void;
export const summonErrorPage = (errorElement: JSX.Element | undefined) =>
  exposedSetError(errorElement);

export function Contexts({
  children,
}: {
  readonly children: JSX.Element | RA<JSX.Element>;
}): JSX.Element {
  React.useEffect(() => Modal.setAppElement('#root'), []);

  const holders = React.useRef<RA<number>>([]);

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();

  const handle = React.useCallback(
    (promise: Promise<unknown>): void => {
      const holderId = holders.current.length;
      holders.current = [...holders.current, holderId];
      handleLoading();
      promise
        .catch((error: Error) => {
          crash(error);
          throw error;
        })
        .finally(() => {
          holders.current = holders.current.filter((item) => item !== holderId);
          if (holders.current.length === 0) handleLoaded();
        });
    },
    [handleLoading, handleLoaded]
  );

  const [error, setError] = React.useState<JSX.Element | undefined>(undefined);
  React.useEffect(() => {
    exposedSetError = setError;
  }, []);

  const eventsRef = React.useRef<EventsRef['current']>({
    events: {},
    eventOccurrences: {},
    eventTarget: new EventTarget(),
  });

  const [calendars] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<RA<Calendar>>('/api/table/calendar', {
          headers: { Accept: 'application/json' },
        }).then(({ data }) =>
          Object.fromEntries(data.map((calendar) => [calendar.id, calendar]))
        ),
      []
    ),
    false
  );

  return (
    <LoadingContext.Provider value={handle}>
      <LoadingScreen isLoading={isLoading} />
      <ErrorContext.Provider value={setError}>
        {error}
        <EventsContext.Provider value={eventsRef}>
          <CalendarsContext.Provider value={calendars}>
            {children}
          </CalendarsContext.Provider>
        </EventsContext.Provider>
      </ErrorContext.Provider>
    </LoadingContext.Provider>
  );
}

export const LoadingContext = React.createContext<
  (promise: Promise<unknown>) => void
>(() => error('Not defined'));
LoadingContext.displayName = 'LoadingContext';

export const ErrorContext = React.createContext<
  (errorElement: JSX.Element) => void
>(() => error('Not defined'));
ErrorContext.displayName = 'ErrorContext';

// Stores events and event occurrences
export const EventsContext = React.createContext<EventsRef>({
  current: {
    events: {},
    eventOccurrences: {},
    eventTarget: new EventTarget(),
  },
});
EventsContext.displayName = 'EventsContext';

// Stores calendars
export const CalendarsContext = React.createContext<IR<Calendar> | undefined>(
  {}
);
CalendarsContext.displayName = 'CalendarsContext';
