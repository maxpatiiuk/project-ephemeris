import type { Connection } from 'mysql2/promise';

import { getTableColumns } from '../pages/api/table/[table]';
import { Http } from './ajax';
import type { ResponsePayload } from './apiUtils';
import { error } from './assert';
import { tables } from './dataModel';
import { f } from './functools';
import { sortFunction, split } from './helpers';
import { execute } from './mysql';
import type { IR, RA } from './types';
import { ensure } from './types';
import { normalizeValue } from './inMemoryDatabase';

export const queryRecord = async <TYPE>(
  connection: Connection,
  sql: string,
  args: RA<unknown>,
): Promise<ResponsePayload<TYPE>> =>
  f.var(
    await queryRecords<TYPE>(connection, sql, args),
    ({ body: [record] }) =>
      typeof record === 'undefined'
        ? {
            status: Http.NOT_FOUND,
            body: '' as unknown as TYPE,
          }
        : {
            status: Http.OK,
            body: record,
          },
  );

export const queryRecords = async <TYPE>(
  connection: Connection,
  sql: string,
  args: RA<unknown>,
): Promise<ResponsePayload<RA<TYPE>>> => ({
  status: Http.OK,
  body: await execute<RA<TYPE>>(connection, sql, args),
});

const operators = ensure<
  IR<
    (filterValue: string) => Readonly<[sql: string, ...parameters: RA<string>]>
  >
>()({
  equal: (filterValue: string) => [`= ?`, filterValue],
  notEqual: (filterValue: string) => [`!= ?`, filterValue],
  less: (filterValue: string) => [`< ?`, filterValue],
  lessEqual: (filterValue: string) => [`<= ?`, filterValue],
  greater: (filterValue: string) => [`> ?`, filterValue],
  greaterEqual: (filterValue: string) => [`>= ?`, filterValue],
  like: (filterValue: string) => [`LIKE ?`, filterValue],
  notLike: (filterValue: string) => [`NOT LIKE ?`, filterValue],
  contains: (filterValue: string) => [`LIKE ?`, `%${filterValue}%`],
  notContains: (filterValue: string) => [`NOT LIKE ?`, `%${filterValue}%`],
  startsWith: (filterValue: string) => [`LIKE ?`, `${filterValue}%`],
  notStartsWith: (filterValue: string) => [`NOT LIKE ?`, `${filterValue}%`],
  endsWith: (filterValue: string) => [`LIKE ?`, `%${filterValue}`],
  notEndsWith: (filterValue: string) => [`NOT LIKE ?`, `%${filterValue}`],
  in: (filterValue: string) =>
    f.var(filterValue.split(','), (values) => [
      `IN (${values.map(() => '?').join(', ')})`,
      ...values,
    ]),
  notIn: (filterValue: string) =>
    f.var(filterValue.split(','), (values) => [
      `NOT IN (${values.map(() => '?').join(', ')})`,
      ...values,
    ]),
  isNull: () => [`IS NULL`],
  isNotNull: () => [`IS NOT NULL`],
} as const);

const filterDelimiter = '_';

export const normalizeColumn = (
  tableName: keyof typeof tables,
  fieldName: string,
) =>
  Object.keys(tables[tableName]).find(
    (columnName) => fieldName.toLowerCase() === columnName.toLowerCase(),
  ) ??
  error(
    `Unknown field "${fieldName}". Allowed fields include ${getTableColumns(
      tableName,
    ).join(', ')}`,
  );

function processFilters<T>(
  rawFilters: IR<string>,
  tableName: keyof typeof tables,
  operators: IR<T>,
) {
  const [filters, [[, rawOrderBy] = []] = []] = split(
    Object.entries(rawFilters).map(
      ([filterName, filterValue]) =>
        [filterName.split(filterDelimiter), filterValue] as const,
    ),
    ([[fieldName]]) => fieldName.toLowerCase() === 'orderBy'.toLowerCase(),
  );

  const parsed = filters.map(
    ([[fieldName, rawOperator = 'equal'], filterValue]) => {
      const column = normalizeColumn(tableName, fieldName);

      const operator = Object.entries(operators).find(
        ([filter]) => filter.toLowerCase() === rawOperator.toLowerCase(),
      )?.[1];

      if (operator === undefined)
        throw new Error(
          `Unknown filter "${operator}". Allowed filters include ${Object.keys(
            operators,
          ).join(', ')}`,
        );

      return [column, operator, filterValue] as const;
    },
  );

  const orderBy =
    typeof rawOrderBy === 'string'
      ? normalizeColumn(tableName, rawOrderBy)
      : undefined;
  const orderByDirection = orderBy?.startsWith('-') ? 'DESC' : 'ASC';

  return { filters: parsed, orderBy, orderByDirection };
}

/**
 * Convert query string parameters to an SQL WHERE clause
 */
export function filtersToSql(
  rawFilters: IR<string>,
  tableName: keyof typeof tables,
): Readonly<[sql: string, values: RA<string>]> {
  const { filters, orderBy, orderByDirection } = processFilters(
    rawFilters,
    tableName,
    operators,
  );

  const parsed = filters
    .map(
      ([fieldName, filterHandler, filterValue]) =>
        [fieldName, filterHandler(filterValue)] as const,
    )
    .map(
      ([fieldName, [sql, ...values]]) =>
        [`\`${fieldName}\` ${sql}`, ...values] as const,
    );

  const orderByString =
    typeof orderBy === 'string'
      ? ` ORDER BY ${orderBy} ${orderByDirection}`
      : '';

  return [
    `${
      parsed.length === 0
        ? ''
        : `WHERE ${parsed.map(([sql]) => sql).join(' AND ')}`
    }${orderByString}`,
    parsed.flatMap(([_sql, ...values]) => values),
  ] as const;
}

export function applyFilters(
  records: RA<IR<unknown>>,
  rawFilters: IR<string>,
  tableName: keyof typeof tables,
): RA<IR<unknown>> {
  const { filters, orderBy, orderByDirection } = processFilters(
    rawFilters,
    tableName,
    arrayOperators,
  );

  const filteredRecords = records.filter((record) =>
    filters.every(([columnName, filterFunction, filterValue]) =>
      filterFunction(
        normalizeValue(
          tableName,
          columnName,
          (record[columnName.toLowerCase()] ?? record[columnName]) as string,
        ) as string,
        normalizeValue(tableName, columnName, filterValue) as string,
      ),
    ),
  );

  return typeof orderBy === 'string'
    ? filteredRecords.sort(
        sortFunction(
          (record) => record[orderBy] as string,
          orderByDirection === 'DESC',
        ),
      )
    : filteredRecords;
}

const likeToRegex = (like: string) =>
  like.replace(/%/g, '.*').replace(/_/g, '.').replace(/\\./g, '.');

const arrayOperators: IR<(value: string, filterValue: string) => boolean> = {
  equal: (value: string, filterValue: string) => value == filterValue,
  notEqual: (value: string, filterValue: string) => value != filterValue,
  less: (value: string, filterValue: string) => value < filterValue,
  lessEqual: (value: string, filterValue: string) => value <= filterValue,
  greater: (value: string, filterValue: string) => value > filterValue,
  greaterEqual: (value: string, filterValue: string) => value >= filterValue,
  like: (value: string, filterValue: string) =>
    new RegExp(likeToRegex(filterValue)).test(value),
  notLike: (value: string, filterValue: string) =>
    !new RegExp(likeToRegex(filterValue)).test(value),
  contains: (value: string, filterValue: string) => value.includes(filterValue),
  notContains: (value: string, filterValue: string) =>
    !value.includes(filterValue),
  startsWith: (value: string, filterValue: string) =>
    value.startsWith(filterValue),
  notStartsWith: (value: string, filterValue: string) =>
    !value.startsWith(filterValue),
  endsWith: (value: string, filterValue: string) => value.endsWith(filterValue),
  notEndsWith: (value: string, filterValue: string) =>
    !value.endsWith(filterValue),
  in: (value: string, filterValue: string) =>
    filterValue.split(',').some((filterValue) => filterValue == value),
  notIn: (value: string, filterValue: string) =>
    !filterValue.split(',').some((filterValue) => filterValue == value),
  isNull: (value: string) => value == null,
  isNotNull: (value: string) => value != null,
};
