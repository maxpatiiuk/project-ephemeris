import React from 'react';

import { serializeDate } from '../lib/dateUtils';
import type { RA } from '../lib/types';
import { globalText } from '../localization/global';
import { className, Link } from './Basic';
import { getMonthDays } from './MiniCalendar';

function DayEvents({ events }: { readonly events: RA<''> }): JSX.Element {
  return (
    <div
      className={`flex-1 flex flex-col overflow-auto ${
        events.length === 0 ? 'justify-center items-center' : ''
      }`}
    >
      {/* TODO: display events */}
      {events.length === 0 && globalText('noEvents')}
    </div>
  );
}

export function MonthView({
  currentDate,
}: {
  readonly currentDate: Date;
}): JSX.Element {
  const days = React.useMemo(
    () => getMonthDays(currentDate, true),
    [currentDate]
  );
  return (
    <div className="grid grid-cols-7 grid-rows-6">
      {days.previousMonth.map(([label, date]) => (
        <div className="border flex flex-col gap-1" key={label}>
          <div className="flex justify-center">
            <Link.Default
              className={`${className.miniCalendarDay} text-gray-500`}
              href={`/view/day/date/${serializeDate(date)}`}
            >
              {label}
            </Link.Default>
          </div>
          <DayEvents events={[]} />
        </div>
      ))}
      {days.currentMonth.map(([label, date]) => (
        <div className="border flex flex-col gap-1" key={label}>
          <div className="flex justify-center">
            <Link.Default
              className={`${className.miniCalendarDay}  ${
                days.todayDay === label ? 'bg-brand-300' : ''
              }`}
              href={`/view/day/date/${serializeDate(date)}`}
            >
              {label}
            </Link.Default>
          </div>
          <DayEvents events={[]} />
        </div>
      ))}
      {days.nextMonth.map(([label, date]) => (
        <div className="border flex flex-col gap-1" key={label}>
          <div className="flex justify-center">
            <Link.Default
              className={`${className.miniCalendarDay} text-gray-500`}
              href={`/view/day/date/${serializeDate(date)}`}
            >
              {label}
            </Link.Default>
          </div>
          <DayEvents events={[]} />
        </div>
      ))}
    </div>
  );
}
