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
