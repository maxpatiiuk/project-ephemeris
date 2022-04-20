import { MILLISECONDS, MINUTE } from '../components/Internationalization';
import { f } from './functools';
import { defined, filterArray } from './types';

export const serializeDate = (date: Date): string =>
  date.toLocaleDateString().replaceAll('/', '_');

export const deserializeDate = (dateString: string): Date =>
  new Date(dateString.replaceAll('_', '/'));

export const padNumber = (number: number): string =>
  number.toString().padStart(2, '0');

export const dateToDatetimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${padNumber(date.getMonth())}-${padNumber(
    date.getDate()
  )}T${dateToTimeString(date)}`;

export const dateToTimeString = (date: Date): string =>
  `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

// Create event of this length by default
export const DEFAULT_EVENT_DURATION = 15 * MINUTE * MILLISECONDS;

// Round current time to nearest 15 minutes when getting time for new event
export const DEFAULT_MINUTE_ROUNDING = 15;

export const MARKS_IN_DAY = 24;

const reDateTimeLocal = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
export const parseDateTimeLocal = (dateString: string): Date =>
  new Date(
    ...defined(
      reDateTimeLocal.exec(dateString)?.slice(1).map(f.unary(Number.parseInt))
    )
  );

const reTime = /^(\d{2})_(\d{2})$/;
export const parseReTime = (
  timeString: string
): Readonly<[number, number]> | undefined =>
  f.var(
    filterArray(reTime.exec(timeString)?.slice(1).map(f.parseInt) ?? []),
    (time) => (time.length === 2 ? (time as [number, number]) : undefined)
  );
