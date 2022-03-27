import { Http } from '../../../../lib/ajax';
import type { Payload } from '../../../../lib/apiUtils';
import { endpoint } from '../../../../lib/apiUtils';
import { error } from '../../../../lib/assert';
import { tables } from '../../../../lib/datamodel';
import { f } from '../../../../lib/functools';
import { execute } from '../../../../lib/mysql';
import { filtersToSql, queryRecords } from '../../../../lib/query';
import type { IR } from '../../../../lib/types';

export const parseTableName = (tableName: string): keyof typeof tables =>
  Object.keys(tables).find(
    (key) => key.toLowerCase() === tableName.toLowerCase()
  ) ??
  error(
    `"${tableName}" is not a valid table Name. Table names include ${Object.keys(
      tables
    ).join(', ')}`
  );

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
    execute(
      connection,
      `INSERT INTO \`${parseTableName(table)}\` (${Object.keys(
        tables[parseTableName(table)]
      ).join(', ')}) VALUES (?, ?, ?, ?)`,
      Object.keys(tables[parseTableName(table)]).map((column) => body[column])
    ).then(() => ({ status: Http.CREATED, body: '' })),
});
