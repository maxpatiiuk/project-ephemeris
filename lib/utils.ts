import { MILLISECONDS, MINUTE } from '../components/Internationalization';
import { f } from './functools';
import { defined } from './types';

export const serializeDate = (date: Date): string =>
  date.toLocaleDateString().replaceAll('/', '_');

export const deserializeDate = (dateString: string): Date =>
  new Date(dateString.replaceAll('_', '/'));

const padNumber = (number: number): string =>
  number.toString().padStart(2, '0');

export const dateToDatetimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${padNumber(date.getMonth())}-${padNumber(
    date.getDate()
  )}T${dateToTimeString(date)}`;

const dateToTimeString = (date: Date): string =>
  `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

// Create event of this length by default
export const DEFAULT_EVENT_DURATION = 15 * MINUTE * MILLISECONDS;

// Round current time to nearest 15 minutes when getting time for new event
export const DEFAULT_MINUTE_ROUNDING = 15;

const reDateTimeLocal = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
export const parseDateTimeLocal = (dateString: string): Date =>
  new Date(
    ...defined(
      reDateTimeLocal.exec(dateString)?.slice(1).map(f.unary(Number.parseInt))
    )
  );
