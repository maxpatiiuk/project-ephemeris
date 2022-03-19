import React from 'react';

import type { RA } from '../lib/types';
import { globalText } from '../localization/global';
import { Button, className } from './Basic';
import { icons } from './Icons';
import { countDaysInMonth, months } from './Internationalization';

export const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;
const MONTH_HEIGHT = 5;

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
  const previousMonthDaysToShow = weekDayForFirstDay - 1;

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
          daysInPreviousMonth - weekDayForFirstDay + index + 2,
          new Date(
            previousMonthYear,
            previousMonth,
            daysInPreviousMonth - weekDayForFirstDay + index + 2
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
            : 0),
      },
      (_, index) =>
        [index + 1, new Date(nextMonthYear, nextMonth, index + 1)] as const
    ),
  };
}

export function MiniCalendar({
  currentDate,
  onDateSelect: handleDateSelect,
  mode,
}: {
  readonly currentDate: Date;
  readonly onDateSelect: (newDate: Date) => void;
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
            <Button.LikeLink
              onClick={(): void => handleDateSelect(days.thisDayLastMonth)}
            >
              {icons.chevronLeft}
            </Button.LikeLink>
            <Button.LikeLink
              onClick={(): void => handleDateSelect(days.thisDayNextMonth)}
            >
              {icons.chevronRight}
            </Button.LikeLink>
          </>
        )}
      </div>
      <div className="grid grid-cols-7">
        {globalText('daysOfWeek')
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
          <Button.LikeLink
            className={`${className.miniCalendarDay} text-gray-500`}
            key={`previousMonth_${label}`}
            onClick={(): void => handleDateSelect(date)}
          >
            {label}
          </Button.LikeLink>
        ))}
        {days.currentMonth.map(([label, date]) => (
          <Button.LikeLink
            className={`${className.miniCalendarDay} ${
              label === days.day && mode === 'aside'
                ? 'bg-brand-200'
                : days.todayDay === label
                ? 'bg-brand-300'
                : ''
            }`}
            key={`currentMonth_${label}`}
            onClick={(): void => handleDateSelect(date)}
          >
            {label}
          </Button.LikeLink>
        ))}
        {days.nextMonth.map(([label, date]) => (
          <Button.LikeLink
            className={`${className.miniCalendarDay} text-gray-500`}
            key={`nextMonth_${label}`}
            onClick={(): void => handleDateSelect(date)}
          >
            {label}
          </Button.LikeLink>
        ))}
      </div>
    </section>
  );
}
