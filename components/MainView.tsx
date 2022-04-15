import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar, EventOccurrence, EventTable } from '../lib/datamodel';
import { f } from '../lib/functools';
import type { IR, R, RA } from '../lib/types';
import { globalText } from '../localization/global';
import type { View } from '../pages/view/[view]/date/[date]/[[...occurrenceId]]';
import { DayView } from './DayView';
import { crash } from './ErrorBoundary';
import { Dialog } from './ModalDialog';
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
  calendars,
}: {
  readonly view: View;
  readonly date: Date;
  readonly enabledCalendars: RA<number>;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const eventsRef = React.useRef<EventsRef['current']>({
    events: {},
    eventOccurrences: {},
  });
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
          eventsRef={eventsRef}
          calendars={calendars}
        />
      ) : (
        <DayView
          currentDate={date}
          enabledCalendars={enabledCalendars}
          eventsRef={eventsRef}
          calendars={calendars}
        />
      )}
      {typeof currentOccurrence === 'object' && (
        <Dialog
          modal={false}
          header={currentOccurrence.name}
          onClose={(): void =>
            void router
              .push(`/view/${view}/date${router.query.date as string}`)
              .catch(crash)
          }
          buttons={globalText('close')}
        >
          <pre>{JSON.stringify(currentOccurrence, null, 4)}</pre>
        </Dialog>
      )}
    </>
  );
}
