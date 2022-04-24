import { capitalize } from '../lib/helpers';
import type { RA } from '../lib/types';
import { globalText } from '../localization/global';
import { LANGUAGE } from '../localization/utils';

/* This is an incomplete definition. For complete, see MDN Docs */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Intl {
  class DisplayNames {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly type:
          | 'calendar'
          | 'currency'
          | 'dateTimeField'
          | 'language'
          | 'region'
          | 'script';
      }
    );

    public of(code: string): string;
  }

  class RelativeTimeFormat {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly numeric: 'auto' | 'always';
        readonly style: 'long' | 'short' | 'narrow';
      }
    );

    public format(
      count: number,
      type: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
    ): string;
  }

  class DateTimeFormat {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly weekday?: 'long' | 'short';
        readonly dateStyle?: 'full' | 'long' | 'medium' | 'short';
        readonly timeStyle?: 'full' | 'long' | 'medium' | 'short';
        readonly month?: 'long' | 'short';
        readonly timeZone?: 'UTC';
      }
    );

    public format(value: Readonly<Date>): string;
  }

  class Collator {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly sensitivity?: 'base' | 'accent' | 'case' | 'variant';
        readonly caseFirst?: 'upper' | 'lower' | false;
        readonly ignorePunctuation?: boolean;
      }
    );

    public compare(left: string, right: string): -1 | 0 | 1;
  }
}

function getMonthNames(monthFormat: 'long' | 'short'): RA<string> {
  const months = new Intl.DateTimeFormat(LANGUAGE, { month: monthFormat });
  return Array.from({ length: 12 }, (_, month) =>
    months.format(new Date(0, month, 2, 0, 0, 0))
  );
}

// Localized month names
export const months = getMonthNames('long');

const datePartLocalizer = new Intl.DisplayNames(LANGUAGE, {
  type: 'dateTimeField',
});
export const dateParts = {
  day: capitalize(datePartLocalizer.of('day')),
  week: globalText('week'),
  month: capitalize(datePartLocalizer.of('month')),
  year: capitalize(datePartLocalizer.of('year')),
} as const;

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const MILLISECONDS = 1000;
const SECOND = 1;
export const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 4 * WEEK;
export const YEAR = 12 * MONTH;
/* eslint-enable @typescript-eslint/no-magic-numbers */
const relativeDate = new Intl.RelativeTimeFormat(LANGUAGE, {
  numeric: 'auto',
  style: 'long',
});

export function getRelativeDate(date: Readonly<Date>): string {
  const timePassed = Math.round((Date.now() - date.getTime()) / MILLISECONDS);
  return formatRelativeDate(timePassed < 0 ? -1 : 1, Math.abs(timePassed));
}

function formatRelativeDate(direction: -1 | 1, timePassed: number): string {
  if (timePassed <= MINUTE)
    return relativeDate.format(
      direction * Math.round(timePassed / SECOND),
      'second'
    );
  else if (timePassed <= HOUR)
    return relativeDate.format(
      direction * Math.round(timePassed / MINUTE),
      'minute'
    );
  else if (timePassed <= DAY)
    return relativeDate.format(
      direction * Math.round(timePassed / HOUR),
      'hour'
    );
  else if (timePassed <= WEEK)
    return relativeDate.format(direction * Math.round(timePassed / DAY), 'day');
  else if (timePassed <= MONTH)
    return relativeDate.format(
      direction * Math.round(timePassed / WEEK),
      'week'
    );
  else if (timePassed <= YEAR)
    return relativeDate.format(
      direction * Math.round(timePassed / MONTH),
      'month'
    );
  else
    return relativeDate.format(
      direction * Math.round(timePassed / YEAR),
      'year'
    );
}

export const countDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const weekDayFormatter = new Intl.DateTimeFormat(LANGUAGE, {
  weekday: 'long',
  timeZone: 'UTC',
});
export const weekDays = Array.from(
  { length: WEEK / DAY },
  (_, index) =>
    new Date(
      `2017-01-${index < 9 ? `0${index + 1}` : index + 1}T00:00:00+00:00`
    )
).map(weekDayFormatter.format);

export const compareStrings = new Intl.Collator(
  typeof window === 'object' ? window.navigator.language : 'en-us',
  {
    sensitivity: 'base',
    caseFirst: 'upper',
    ignorePunctuation: true,
  }
).compare;
