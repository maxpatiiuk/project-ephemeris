import { Http } from '../../../../lib/ajax';
import type { Payload } from '../../../../lib/apiUtils';
import { endpoint } from '../../../../lib/apiUtils';
import { tables } from '../../../../lib/dataModel';
import { inMemory } from '../../../../lib/inMemoryDatabase';
import { execute } from '../../../../lib/mysql';
import { queryRecord } from '../../../../lib/query';
import type { IR } from '../../../../lib/types';
import { getTableColumns, parseTableName } from './index';

export default endpoint({
  async GET({
    connection,
    query: { id, table },
  }: Payload<never, 'id' | 'table'>) {
    return connection === undefined
      ? inMemory.fetchRecord(parseTableName(table), Number.parseInt(id))
      : queryRecord<IR<unknown>>(
          connection,
          `SELECT * FROM \`${parseTableName(table)}\` WHERE id=?`,
          [Number.parseInt(id)],
        );
  },
  PUT: async ({
    body,
    connection,
    query: { id, table },
  }: Payload<IR<unknown>, 'id' | 'table'>) =>
    connection === undefined
      ? inMemory.updateRecord(parseTableName(table), Number.parseInt(id), body)
      : execute(
          connection,
          `UPDATE \`${parseTableName(table)}\` SET ${Object.keys(
            tables[parseTableName(table)],
          )
            .map((column) => `${column}=?`)
            .join(', ')} WHERE id=?`,
          [
            ...Object.keys(tables[parseTableName(table)]).map(
              (column) => body[column.toLowerCase()] ?? body[column],
            ),
            Number.parseInt(id),
          ],
        ).then(() => ({
          status: Http.OK,
          body: {
            id: Number.parseInt(id),
            ...Object.fromEntries(
              getTableColumns(table).map((column) => [
                column,
                body[column.toLowerCase()] ?? body[column],
              ]),
            ),
          },
        })),
  DELETE: async ({
    connection,
    query: { id, table },
  }: Payload<never, 'id' | 'table'>) =>
    connection === undefined
      ? inMemory.deleteRecord(parseTableName(table), Number.parseInt(id))
      : execute(
          connection,
          `DELETE FROM \`${parseTableName(table)}\` WHERE id=?`,
          [Number.parseInt(id)],
        ).then(() => ({ status: Http.NO_CONTENT, body: '' })),
});
