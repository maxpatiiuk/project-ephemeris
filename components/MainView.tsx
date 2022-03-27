import React from 'react';

import type { EventTable } from '../lib/datamodel';
import type { R, RA } from '../lib/types';
import type { View } from '../pages';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';

export type EventsRef = React.MutableRefObject<
  R<Promise<EventTable> | undefined>
>;

export function MainView({
  type,
  date,
  onDateSelect: handleDateSelect,
  onViewChange: handleViewChange,
  enabledCalendars,
}: {
  readonly type: View;
  readonly date: Date;
  readonly onDateSelect: (newDate: Date) => void;
  readonly onViewChange: (newView: View) => void;
  readonly enabledCalendars: RA<number>;
}): JSX.Element {
  const eventsRef = React.useRef<R<Promise<EventTable> | undefined>>({});
  return type === 'year' ? (
    <YearView
      currentDate={date}
      onDateSelect={(newDate): void => {
        handleDateSelect(newDate);
        handleViewChange('week');
      }}
    />
  ) : type === 'month' ? (
    <MonthView
      currentDate={date}
      onDateSelect={(newDate): void => {
        handleDateSelect(newDate);
        handleViewChange('week');
      }}
    />
  ) : type === 'week' ? (
    <WeekView
      currentDate={date}
      onDateSelect={(newDate): void => {
        handleDateSelect(newDate);
        handleViewChange('day');
      }}
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
