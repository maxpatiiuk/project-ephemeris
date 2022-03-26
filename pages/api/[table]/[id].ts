import type { Payload } from '../../../lib/apiUtils';
import { endpoint, Http } from '../../../lib/apiUtils';
import { tables } from '../../../lib/datamodel';
import { queryRecord } from '../../../lib/query';
import type { IR } from '../../../lib/types';

export default endpoint({
  GET: async ({
    connection,
    query: { id, table },
  }: Payload<never, 'id' | 'table'>) =>
    queryRecord<IR<unknown>>(
      connection,
      `SELECT * FROM \`${table}\` WHERE id=?`,
      [Number.parseInt(id)]
    ),
  PUT: async ({
    body,
    connection,
    query: { id, table },
  }: Payload<IR<unknown>, 'id' | 'table'>) =>
    connection
      .execute(
        `UPDATE \`${table}\` SET ${Object.keys(
          tables[table as keyof typeof tables]
        )
          .map((column) => `${column}=?`)
          .join(', ')} WHERE id=?`,
        [
          ...Object.keys(tables[table as keyof typeof tables]).map(
            (column) => body[column]
          ),
          Number.parseInt(id),
        ]
      )
      .then(() => ({ status: Http.NO_CONTENT, body: '' })),
  DELETE: async ({
    connection,
    query: { id, table },
  }: Payload<never, 'id' | 'table'>) =>
    connection
      .execute(`SELECT * FROM \`${table}\` WHERE id=?`, [Number.parseInt(id)])
      .then(() => ({ status: Http.NO_CONTENT, body: '' })),
});
