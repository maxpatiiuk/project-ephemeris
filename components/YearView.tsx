import React from 'react';

import { Container } from './Basic';
import { MiniCalendar } from './MiniCalendar';

const MONTHS_IN_YEAR = 12;

export function YearView({
  currentDate,
}: {
  readonly currentDate: Date;
}): JSX.Element {
  const year = currentDate.getFullYear();
  const dates = React.useMemo(
    () =>
      Array.from(
        { length: MONTHS_IN_YEAR },
        (_, index) => new Date(year, index, 0)
      ),
    [year]
  );
  return (
    <Container.Full className="grid grid-cols-4 grid-rows-3 gap-6 p-4">
      {dates.map((date, index) => (
        <MiniCalendar key={index} currentDate={date} mode="yearPart" />
      ))}
    </Container.Full>
  );
}
