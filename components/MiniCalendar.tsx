import React from 'react';

import { getMonthDays, serializeDate, startWithSunday } from '../lib/utils';
import { globalText } from '../localization/global';
import type { View } from '../pages/view/[view]/date/[date]/[[...occurrenceId]]';
import { className, Link } from './Basic';
import { months } from './Internationalization';

export function MiniCalendar({
  currentDate,
  view,
  mode,
}: {
  readonly currentDate: Date;
  readonly view: View;
  readonly mode: 'aside' | 'yearPart';
}): JSX.Element {
  const days = React.useMemo(() => getMonthDays(currentDate), [currentDate]);
  return (
    <section>
      <div className="flex gap-2">
        <h2>{`${months[days.month]} ${days.year}`}</h2>
        <span className="flex-1 -ml-2" />
        {mode === 'aside' && (
          <>
            <Link.Icon
              icon="chevronLeft"
              href={`/view/${view}/date/${serializeDate(
                days.thisDayLastMonth
              )}`}
              title={globalText('previous')}
              aria-label={globalText('previous')}
            />
            <Link.Icon
              icon="chevronRight"
              href={`/view/${view}/date/${serializeDate(
                days.thisDayLastMonth
              )}`}
              title={globalText('next')}
              aria-label={globalText('next')}
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-7">
        {(startWithSunday
          ? globalText('daysOfWeek')
          : globalText('daysOfWeekEurope')
        )
          .split('')
          .map((dayOfWeek, index) => (
            <div
              key={index}
              className={`${className.miniCalendarDay} text-gray-500`}
            >
              {dayOfWeek}
            </div>
          ))}
        {days.previousMonth.map(([label, date]) => (
          <Link.Default
            className={`${className.miniCalendarDay} text-gray-500`}
            key={`previousMonth_${label}`}
            href={`/view/${view}/date/${serializeDate(date)}`}
          >
            {label}
          </Link.Default>
        ))}
        {days.currentMonth.map(([label, date]) => (
          <Link.Default
            className={`${className.miniCalendarDay} ${
              label === days.day && mode === 'aside'
                ? 'bg-brand-200'
                : days.todayDay === label
                ? 'bg-brand-300'
                : ''
            }`}
            key={`currentMonth_${label}`}
            href={`/view/${view}/date/${serializeDate(date)}`}
          >
            {label}
          </Link.Default>
        ))}
        {days.nextMonth.map(([label, date]) => (
          <Link.Default
            className={`${className.miniCalendarDay} text-gray-500`}
            key={`nextMonth_${label}`}
            href={`/view/${view}/date/${serializeDate(date)}`}
          >
            {label}
          </Link.Default>
        ))}
      </div>
    </section>
  );
}
