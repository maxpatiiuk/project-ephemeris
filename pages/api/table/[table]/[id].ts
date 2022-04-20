import { Http } from '../../../../lib/ajax';
import type { Payload } from '../../../../lib/apiUtils';
import { endpoint } from '../../../../lib/apiUtils';
import { tables } from '../../../../lib/datamodel';
import { execute } from '../../../../lib/mysql';
import { queryRecord } from '../../../../lib/query';
import type { IR } from '../../../../lib/types';
import { getTableColumns, parseTableName } from './index';

export default endpoint({
  GET: async ({
    connection,
    query: { id, table },
  }: Payload<never, 'id' | 'table'>) =>
    queryRecord<IR<unknown>>(
      connection,
      `SELECT * FROM \`${parseTableName(table)}\` WHERE id=?`,
      [Number.parseInt(id)]
    ),
  PUT: async ({
    body,
    connection,
    query: { id, table },
  }: Payload<IR<unknown>, 'id' | 'table'>) =>
    execute(
      connection,
      `UPDATE \`${parseTableName(table)}\` SET ${Object.keys(
        tables[parseTableName(table)]
      )
        .map((column) => `${column}=?`)
        .join(', ')} WHERE id=?`,
      [
        ...Object.keys(tables[parseTableName(table)]).map(
          (column) => body[column.toLowerCase()] ?? body[column]
        ),
        Number.parseInt(id),
      ]
    ).then(() => ({
      status: Http.OK,
      body: {
        id: Number.parseInt(id),
        ...Object.fromEntries(
          getTableColumns(table).map((column) => [
            column,
            body[column.toLowerCase()] ?? body[column],
          ])
        ),
      },
    })),
  DELETE: async ({
    connection,
    query: { id, table },
  }: Payload<never, 'id' | 'table'>) =>
    execute(connection, `DELETE FROM \`${parseTableName(table)}\` WHERE id=?`, [
      Number.parseInt(id),
    ]).then(() => ({ status: Http.NO_CONTENT, body: '' })),
});
