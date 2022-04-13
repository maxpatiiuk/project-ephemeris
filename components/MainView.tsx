import React from 'react';

import type { EventOccurrence, EventTable } from '../lib/datamodel';
import type { R, RA } from '../lib/types';
import type { View } from '../pages/view/[view]/date/[date]';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';

export type EventsRef = React.MutableRefObject<{
  readonly events: R<EventTable>;
  readonly eventOccurrences: R<R<EventOccurrence>>;
}>;

export function MainView({
  type,
  date,
  enabledCalendars,
}: {
  readonly type: View;
  readonly date: Date;
  readonly enabledCalendars: RA<number>;
}): JSX.Element {
  const eventsRef = React.useRef<EventsRef['current']>({
    events: {},
    eventOccurrences: {},
  });
  return type === 'year' ? (
    <YearView currentDate={date} />
  ) : type === 'month' ? (
    <MonthView currentDate={date} />
  ) : type === 'week' ? (
    <WeekView
      currentDate={date}
      enabledCalendars={enabledCalendars}
      eventsRef={eventsRef}
    />
  ) : (
    <DayView
      currentDate={date}
      enabledCalendars={enabledCalendars}
      eventsRef={eventsRef}
    />
  );
}
