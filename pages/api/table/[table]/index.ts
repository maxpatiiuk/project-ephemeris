import { Http } from '../../../../lib/ajax';
import type { Payload } from '../../../../lib/apiUtils';
import { endpoint } from '../../../../lib/apiUtils';
import { error } from '../../../../lib/assert';
import { tables } from '../../../../lib/dataModel';
import { f } from '../../../../lib/functools';
import { inMemory } from '../../../../lib/inMemoryDatabase';
import { execute } from '../../../../lib/mysql';
import { filtersToSql, queryRecords } from '../../../../lib/query';
import type { IR, RA } from '../../../../lib/types';

export const parseTableName = (tableName: string): keyof typeof tables =>
  Object.keys(tables).find(
    (key) => key.toLowerCase() === tableName.toLowerCase(),
  ) ??
  error(
    `"${tableName}" is not a valid table name. Table names include ${Object.keys(
      tables,
    ).join(', ')}`,
  );

export const getTableColumns = (tableName: string): RA<string> =>
  Object.keys(tables[parseTableName(tableName)]).filter((key) => key !== 'id');

export default endpoint({
  GET: async ({
    connection,
    query: { table, ...filters },
  }: Payload<never, string>) =>
    f.var(
      filtersToSql(filters, parseTableName(table)),
      async ([whereSql, values]) =>
        queryRecords<IR<unknown>>(
          connection,
          `SELECT * FROM \`${parseTableName(table)}\` ${whereSql}`,
          values
        )
    ),
  POST: async ({
    body,
    connection,
    query: { table },
  }: Payload<IR<unknown>, 'table'>) =>
    execute<{ readonly insertId: number }>(
      connection,
      `INSERT INTO \`${parseTableName(table)}\` (${getTableColumns(table).join(
        ', '
      )}) VALUES (${Array.from(getTableColumns(table)).fill('?').join(', ')})`,
      getTableColumns(table).map(
        (column) => body[column.toLowerCase()] ?? body[column]
      )
    ).then(({ insertId }) => ({
      status: Http.CREATED,
      body: {
        id: insertId,
        ...Object.fromEntries(
          getTableColumns(table).map((column) => [
            column,
            body[column.toLowerCase()] ?? body[column],
          ])
        ),
      },
    })),
});
