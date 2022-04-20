import React from 'react';

import type { RA } from '../lib/types';
import { serializeDate } from '../lib/utils';
import { globalText } from '../localization/global';
import type { View } from '../pages/view/[view]/date/[date]/[[...occurrenceId]]';
import { className, Link } from './Basic';
import {
  countDaysInMonth,
  DAY,
  MONTH,
  months,
  WEEK,
  YEAR,
} from './Internationalization';

const DAYS_IN_WEEK = WEEK / DAY;
const MONTHS_IN_YEAR = YEAR / MONTH;
const MONTH_HEIGHT = 5;
const startWithSunday = true;

export function getMonthDays(
  currentDate: Date,
  forceEqualHeight: boolean
): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly todayDay: number | undefined;
  readonly thisDayLastMonth: Date;
  readonly thisDayNextMonth: Date;
  readonly previousMonth: RA<Readonly<[label: number, date: Date]>>;
  readonly currentMonth: RA<Readonly<[label: number, date: Date]>>;
  readonly nextMonth: RA<Readonly<[label: number, date: Date]>>;
} {
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = countDaysInMonth(year, month);
  const previousMonth = month === 1 ? MONTHS_IN_YEAR : month - 1;
  const previousMonthYear = month === 1 ? year - 1 : year;
  const daysInPreviousMonth = countDaysInMonth(
    previousMonthYear,
    previousMonth
  );
  const weekDayForFirstDay = new Date(year, month, 1).getDay();
  const weekDayForLastDay = new Date(year, month, daysInMonth).getDay();
  const nextMonth = (month + 1) % MONTHS_IN_YEAR;
  const nextMonthYear = month === MONTHS_IN_YEAR - 1 ? year + 1 : year;
  const previousMonthDaysToShow =
    weekDayForFirstDay - (startWithSunday ? 0 : 1);

  const todayDate = new Date();
  const showToday =
    todayDate.getMonth() === month && todayDate.getFullYear() == year;
  const todayDay = showToday ? todayDate.getDate() : undefined;
  return {
    year,
    month,
    day,
    todayDay,
    thisDayLastMonth: new Date(
      previousMonthYear,
      previousMonth,
      Math.min(day, daysInPreviousMonth)
    ),
    thisDayNextMonth: new Date(
      nextMonthYear,
      nextMonth,
      Math.min(day, daysInPreviousMonth)
    ),
    previousMonth: Array.from(
      { length: previousMonthDaysToShow },
      (_, index) =>
        [
          daysInPreviousMonth -
            weekDayForFirstDay +
            index +
            (startWithSunday ? 1 : 2),
          new Date(
            previousMonthYear,
            previousMonth,
            daysInPreviousMonth -
              weekDayForFirstDay +
              index +
              (startWithSunday ? 1 : 2)
          ),
        ] as const
    ),
    currentMonth: Array.from(
      { length: daysInMonth },
      (_, index) => [index + 1, new Date(year, month, index + 1)] as const
    ),
    nextMonth: Array.from(
      {
        length:
          DAYS_IN_WEEK -
          weekDayForLastDay +
          (forceEqualHeight &&
          (previousMonthDaysToShow + daysInMonth) / DAYS_IN_WEEK < MONTH_HEIGHT
            ? DAYS_IN_WEEK
            : 0) -
          (startWithSunday ? 1 : 0),
      },
      (_, index) =>
        [index + 1, new Date(nextMonthYear, nextMonth, index + 1)] as const
    ),
  };
}

export function MiniCalendar({
  currentDate,
  view,
  mode,
}: {
  readonly currentDate: Date;
  readonly view: View;
  readonly mode: 'aside' | 'yearPart';
}): JSX.Element {
  const days = React.useMemo(
    () => getMonthDays(currentDate, mode === 'yearPart'),
    [currentDate, mode]
  );
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
