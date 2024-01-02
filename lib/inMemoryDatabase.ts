/**
 * To allow for simplified demo-deployment without a database, a small in-memory
 * database is implemented
 */

import { DAY, MILLISECONDS } from '../components/Internationalization';
import { Http } from './ajax';
import { ResponsePayload } from './apiUtils';
import { Calendar, EventOccurrence, EventTable, tables } from './dataModel';
import { sortFunction } from './helpers';
import { applyFilters } from './query';
import { IR, R, RA } from './types';
import fs from 'node:fs';

let database: {
  calendar: Calendar[];
  event: EventTable[];
  eventOccurrence: EventOccurrence[];
} = {
  calendar: [{ name: 'My calendar', description: '', color: '#123abc', id: 0 }],
  event: [],
  eventOccurrence: [],
};

let idCounter = 1;
const notFound = { status: Http.NOT_FOUND, body: '' as unknown as IR<unknown> };

export const normalizeRecord = (
  record: IR<unknown>,
  tableName: keyof typeof tables,
): IR<unknown> =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      normalizeValue(tableName, key, value as string),
    ]),
  );

export function normalizeValue(
  tableName: keyof typeof tables,
  fieldName: string,
  value: string,
) {
  const table: IR<string | number | boolean | Date> = tables[tableName];
  const type =
    Object.entries(table).find(
      ([column]) => column.toLowerCase() === fieldName.toLowerCase(),
    )?.[1] ?? '';
  return typeof type === 'number'
    ? Number.parseInt(value)
    : typeof type === 'boolean'
      ? Boolean(value)
      : type instanceof Date
        ? new Date(value)
        : value;
}

const inMemoryDatabase = {
  fetchRecord(
    tableName: keyof typeof tables,
    id: number,
  ): ResponsePayload<IR<unknown>> {
    const record = database[tableName].find((table) => table.id === id);
    return record === undefined
      ? notFound
      : {
          status: Http.OK,
          body: record,
        };
  },

  queryRecords: (tableName: keyof typeof database, rawFilters: IR<string>) => ({
    status: Http.OK,
    body: applyFilters(database[tableName], rawFilters, tableName),
  }),

  createRecord(
    tableName: keyof typeof tables,
    body: IR<unknown>,
  ): ResponsePayload<IR<unknown>> {
    idCounter += 1;
    const record = { ...normalizeRecord(body, tableName), id: idCounter };
    database[tableName].push(record as never);
    return { status: Http.CREATED, body: record };
  },

  updateRecord(
    tableName: keyof typeof tables,
    id: number,
    body: IR<unknown>,
  ): ResponsePayload<IR<unknown>> {
    const recordIndex = database[tableName].findIndex(
      (table) => table.id === id,
    );
    if (recordIndex === -1) return notFound;

    database[tableName].splice(
      recordIndex,
      1,
      normalizeRecord(body, tableName) as never,
    );

    return {
      status: Http.OK,
      body: {
        ...body,
        id,
      },
    };
  },

  deleteRecord(
    tableName: keyof typeof tables,
    id: number,
  ): ResponsePayload<IR<unknown>> {
    const recordIndex = database[tableName].findIndex(
      (table) => table.id === id,
    );
    if (recordIndex === -1) return notFound;
    database[tableName].splice(recordIndex, 1);
    return { status: Http.NO_CONTENT, body: '' as unknown as IR<unknown> };
  },

  countEvents: (): IR<number> =>
    database.eventOccurrence
      .map(
        ({ eventId }) =>
          database.event.find(({ id }) => id === eventId)?.calendarId ?? -1,
      )
      .reduce<R<number>>((counted, calendarId) => {
        counted[calendarId] ??= 0;
        counted[calendarId] += 1;
        return counted;
      }, {}),

  searchAroundDate: (
    searchQuery: string,
    currentDate: Date,
  ): RA<
    EventOccurrence & {
      readonly recurring: 1 | 0;
    }
  > =>
    database.eventOccurrence
      .filter(({ name }) => name.includes(searchQuery))
      .map((eventOccurrence) => {
        const event = database.event.find(
          ({ id }) => id === eventOccurrence.eventId,
        );
        return {
          ...eventOccurrence,
          recurring:
            event === undefined
              ? 0
              : event.daysOfWeek !== event.daysOfWeek.toLowerCase() &&
                  event.endDate.getTime() - event.startDate.getTime() > 0
                ? 1
                : 0,
        } as const;
      })
      .sort(
        sortFunction(
          (eventOccurrence) =>
            Math.abs(
              (eventOccurrence.startDateTime.getTime() -
                currentDate.getTime()) /
                DAY /
                MILLISECONDS,
            ) + 1,
          true,
        ),
      ),

  deleteStaleOccurrences(eventId: number, startDateTime: Date): void {
    database.eventOccurrence = database.eventOccurrence.filter(
      (eventOccurrence) =>
        eventId !== eventOccurrence.eventId ||
        eventOccurrence.startDateTime.getTime() <= startDateTime.getTime(),
    );
  },

  // FIXME: remove
  database: () => database,
} as const;

/**
 * If MySQL is not available, in-memory database is used.
 * That works well in production, but breaks in development because of
 * hot-reload. Thus, persist database to file in development.
 */
const dumpDatabase = () =>
  process.env.NODE_ENV === 'development'
    ? fs.writeFileSync('database.json', JSON.stringify(database, null, 2))
    : undefined;

function restoreDatabase() {
  if (process.env.NODE_ENV !== 'development') return;
  database = Object.fromEntries(
    Object.entries(JSON.parse(fs.readFileSync('database.json', 'utf-8'))).map(
      ([table, data]) => [
        table,
        (data as RA<IR<unknown>>).map((data) =>
          normalizeRecord(data, table as keyof typeof tables),
        ),
      ],
    ),
  ) as typeof database;
  idCounter = Math.max(
    ...Object.values(database).flatMap((table) => table.map(({ id }) => id)),
  );
}

function persistData<ARGUMENTS extends RA<unknown>, RETURN>(
  callback: (...args: ARGUMENTS) => RETURN,
): (...args: ARGUMENTS) => RETURN {
  return (...args) => {
    restoreDatabase();
    const result = callback(...args);
    console.log(callback.name, result);
    dumpDatabase();
    return result;
  };
}

export const inMemory = Object.fromEntries(
  Object.entries(inMemoryDatabase).map(([name, callback]) => [
    name,
    persistData(callback as () => void),
  ]),
) as unknown as typeof inMemoryDatabase;
