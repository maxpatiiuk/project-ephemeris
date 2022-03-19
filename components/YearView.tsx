import React from 'react';

import { MiniCalendar } from './MiniCalendar';

const MONTHS_IN_YEAR = 12;

export function YearView({
  currentDate,
  onDateSelect: handleDateSelect,
}: {
  readonly currentDate: Date;
  readonly onDateSelect: (newDate: Date) => void;
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
    <div className="grid grid-cols-4 grid-rows-3 gap-6">
      {dates.map((date, index) => (
        <MiniCalendar
          key={index}
          currentDate={date}
          onDateSelect={handleDateSelect}
          mode="yearPart"
        />
      ))}
    </div>
  );
}
