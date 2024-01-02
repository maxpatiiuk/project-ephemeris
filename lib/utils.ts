import {
  countDaysInMonth,
  DAY,
  MILLISECONDS,
  MINUTE,
  MONTH,
  WEEK,
  YEAR,
} from '../components/Internationalization';
import { f } from './functools';
import type { RA } from './types';
import { filterArray } from './types';

export const serializeDate = (date: Date): string =>
  date.toLocaleDateString().split('/').join('_');

export const deserializeDate = (dateString: string): Date =>
  new Date(dateString.split('_').join('/'));

export const padNumber = (number: number): string =>
  number.toString().padStart(2, '0');

export const dateToString = (date: Date): string =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;

export const dateToDatetimeLocal = (date: Date): string =>
  `${dateToString(date)}T${dateToTimeString(date)}`;

export const dateToTimeString = (date: Date): string =>
  `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

// Create event of this length by default
export const DEFAULT_EVENT_DURATION = 15 * MINUTE * MILLISECONDS;

// Round current time to nearest 15 minutes when getting time for new event
export const DEFAULT_MINUTE_ROUNDING = 15;

export const MARKS_IN_DAY = 24;

const reTime = /^(\d{2})_(\d{2})$/;
export const parseReTime = (
  timeString: string,
): Readonly<[number, number]> | undefined =>
  f.var(
    filterArray(reTime.exec(timeString)?.slice(1).map(f.parseInt) ?? []),
    (time) => (time.length === 2 ? (time as [number, number]) : undefined),
  );

/**
 * Basded on Underscore JS' debounce function
 */
export default function debounce<ARGS extends RA<unknown>>(
  callback: (...args: ARGS) => void,
  wait: number,
): (...args: ARGS) => void {
  let timeout: number | ReturnType<typeof setTimeout> | undefined = undefined;
  let lastCall = 0;

  function later(args: ARGS): void {
    const passed = Date.now() - lastCall;
    if (wait > passed) {
      timeout = setTimeout(() => later(args), wait - passed);
    } else {
      timeout = undefined;
      callback(...args);
    }
  }

  return (...args: ARGS) => {
    lastCall = Date.now();
    if (typeof timeout === 'undefined')
      timeout = setTimeout(() => later(args), wait);
  };
}

const DAYS_IN_WEEK = WEEK / DAY;
const MONTHS_IN_YEAR = YEAR / MONTH;
const MONTH_HEIGHT = 6;
export const startWithSunday = true;

export function getMonthDays(currentDate: Date): {
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
    previousMonth,
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
      Math.min(day, daysInPreviousMonth),
    ),
    thisDayNextMonth: new Date(
      nextMonthYear,
      nextMonth,
      Math.min(day, daysInPreviousMonth),
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
              (startWithSunday ? 1 : 2),
          ),
        ] as const,
    ),
    currentMonth: Array.from(
      { length: daysInMonth },
      (_, index) => [index + 1, new Date(year, month, index + 1)] as const,
    ),
    nextMonth: Array.from(
      {
        length:
          DAYS_IN_WEEK -
          weekDayForLastDay +
          (Math.ceil((previousMonthDaysToShow + daysInMonth) / DAYS_IN_WEEK) <
          MONTH_HEIGHT
            ? DAYS_IN_WEEK
            : 0) -
          (startWithSunday ? 1 : 0),
      },
      (_, index) =>
        [index + 1, new Date(nextMonthYear, nextMonth, index + 1)] as const,
    ),
  };
}
