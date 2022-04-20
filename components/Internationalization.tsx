import React from 'react';

import { capitalize } from '../lib/helpers';
import type { RA } from '../lib/types';
import { globalText } from '../localization/global';
import { LANGUAGE } from '../localization/utils';

/* This is an incomplete definition. For complete, see MDN Docs */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Intl {
  class ListFormat {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly type?: 'conjunction' | 'disjunction';
        readonly style?: 'long' | 'short' | 'narrow';
      }
    );

    public format(values: RA<string>): string;
  }

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

  class NumberFormat {
    public constructor(locales?: string | RA<string>);

    public format(value: number): string;
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
}

const longDate = new Intl.DateTimeFormat(LANGUAGE, {
  dateStyle: 'full',
  timeStyle: 'long',
});

function getMonthNames(monthFormat: 'long' | 'short'): RA<string> {
  const months = new Intl.DateTimeFormat(LANGUAGE, { month: monthFormat });
  return Array.from({ length: 12 }, (_, month) =>
    months.format(new Date(0, month, 2, 0, 0, 0))
  );
}

// Localized month names
export const months = getMonthNames('long');

export function DateElement({
  date,
  fallback = undefined,
  // If true, display full date by default and relative date as a tooltip
  flipDates = false,
}: {
  readonly date: string | undefined;
  readonly fallback?: React.ReactNode;
  readonly flipDates?: boolean;
}): JSX.Element {
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date)))
    return <>{fallback}</>;
  const dateObject = new Date(date);
  const relativeDate = getRelativeDate(dateObject);
  const fullDate = longDate.format(dateObject);
  const [children, title] = flipDates
    ? [fullDate, relativeDate]
    : [relativeDate, fullDate];
  return (
    <time dateTime={dateObject.toISOString()} title={title}>
      {children}
    </time>
  );
}

const listFormatter = new Intl.ListFormat(LANGUAGE, {
  style: 'long',
  type: 'conjunction',
});
export const formatList = (list: RA<string>): string =>
  listFormatter.format(list);

const datePartLocalizer = new Intl.DisplayNames(LANGUAGE, {
  type: 'dateTimeField',
});
export const dateParts = {
  day: capitalize(datePartLocalizer.of('day')),
  week: globalText('week'),
  month: capitalize(datePartLocalizer.of('month')),
  year: capitalize(datePartLocalizer.of('year')),
} as const;

const numberFormatter = new Intl.NumberFormat(LANGUAGE);
export const formatNumber = (number: number): string =>
  numberFormatter.format(number);

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

// TODO: add support for future dates
export function getRelativeDate(date: Readonly<Date>): string {
  const timePassed = Math.round((Date.now() - date.getTime()) / MILLISECONDS);
  if (timePassed < 0) throw new Error('Future dates are not supported');
  else if (timePassed <= MINUTE)
    return relativeDate.format(-Math.round(timePassed / SECOND), 'second');
  else if (timePassed <= HOUR)
    return relativeDate.format(-Math.round(timePassed / MINUTE), 'minute');
  else if (timePassed <= DAY)
    return relativeDate.format(-Math.round(timePassed / HOUR), 'hour');
  else if (timePassed <= WEEK)
    return relativeDate.format(-Math.round(timePassed / DAY), 'day');
  else if (timePassed <= MONTH)
    return relativeDate.format(-Math.round(timePassed / WEEK), 'week');
  else if (timePassed <= YEAR)
    return relativeDate.format(-Math.round(timePassed / MONTH), 'month');
  else return relativeDate.format(-Math.round(timePassed / YEAR), 'year');
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
