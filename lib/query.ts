import type { Connection } from 'mysql2/promise';

import { getTableColumns } from '../pages/api/table/[table]';
import { Http } from './ajax';
import type { ResponsePayload } from './apiUtils';
import { error } from './assert';
import { tables } from './dataModel';
import { f } from './functools';
import { execute } from './mysql';
import type { IR, RA } from './types';
import { ensure } from './types';

export const queryRecord = async <TYPE>(
  connection: Connection,
  sql: string,
  args: RA<unknown>
): Promise<ResponsePayload<TYPE>> =>
  f.var(await queryRecords<TYPE>(connection, sql, args), ({ body: [record] }) =>
    typeof record === 'undefined'
      ? {
          status: Http.NOT_FOUND,
          body: '' as unknown as TYPE,
        }
      : {
          status: Http.OK,
          body: record,
        }
  );

export const queryRecords = async <TYPE>(
  connection: Connection,
  sql: string,
  args: RA<unknown>
): Promise<ResponsePayload<RA<TYPE>>> => ({
  status: Http.OK,
  body: await execute<RA<TYPE>>(connection, sql, args),
});

const operators = ensure<
  IR<(value: string) => Readonly<[sql: string, ...parameters: RA<string>]>>
>()({
  equal: (value: string) => [`= ?`, value],
  notEqual: (value: string) => [`!= ?`, value],
  less: (value: string) => [`< ?`, value],
  lessEqual: (value: string) => [`<= ?`, value],
  greater: (value: string) => [`> ?`, value],
  greaterEqual: (value: string) => [`>= ?`, value],
  like: (value: string) => [`LIKE ?`, value],
  notLike: (value: string) => [`NOT LIKE ?`, value],
  contains: (value: string) => [`LIKE ?`, `%${value}%`],
  notContains: (value: string) => [`NOT LIKE ?`, `%${value}%`],
  startsWith: (value: string) => [`LIKE ?`, `${value}%`],
  notStartsWith: (value: string) => [`NOT LIKE ?`, `${value}%`],
  endsWith: (value: string) => [`LIKE ?`, `%${value}`],
  notEndsWith: (value: string) => [`NOT LIKE ?`, `%${value}`],
  in: (value: string) =>
    f.var(value.split(','), (values) => [
      `IN (${values.map(() => '?').join(', ')})`,
      ...values,
    ]),
  notIn: (value: string) =>
    f.var(value.split(','), (values) => [
      `NOT IN (${values.map(() => '?').join(', ')})`,
      ...values,
    ]),
  isNull: () => [`IS NULL`],
  isNotNull: () => [`IS NOT NULL`],
} as const);

const filterDelimiter = '_';

/**
 * Convert query string parameters to an SQL WHERE clause
 */
export const filtersToSql = (
  filters: IR<string>,
  tableName: keyof typeof tables
): Readonly<[sql: string, values: RA<string>]> =>
  f.var(
    Object.entries(filters)
      .map(
        ([filterName, filterValue]) =>
          [filterName.split(filterDelimiter), filterValue] as const
      )
      .map(
        ([[fieldName, operator = 'equal'], filterValue]) =>
          [
            Object.entries(tables[tableName]).find(
              ([column]) => column.toLowerCase() === fieldName.toLowerCase()
            ) ??
              error(
                `Unknown field "${fieldName}". Allowed fields include ${getTableColumns(
                  tableName
                ).join(', ')}`
              ),
            Object.entries(operators).find(
              ([filter]) => filter.toLowerCase() === operator.toLowerCase()
            ) ??
              error(
                `Unknown filter "${operator}". Allowed filters include ${Object.keys(
                  operators
                ).join(', ')}`
              ),
            filterValue,
          ] as const
      )
      .map(
        ([
          [fieldName, _fieldType],
          [_filterName, filterHandler],
          filterValue,
        ]) => [fieldName, filterHandler(filterValue)] as const
      )
      .map(
        ([fieldName, [sql, ...values]]) =>
          [`\`${fieldName}\` ${sql}`, ...values] as const
      ),
    (parsed) =>
      [
        parsed.length === 0
          ? ''
          : `WHERE ${parsed.map(([sql]) => sql).join(' AND ')}`,
        parsed.flatMap(([_sql, ...values]) => values),
      ] as const
  );
