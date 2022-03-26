import type { Payload } from '../../../lib/apiUtils';
import { endpoint, Http } from '../../../lib/apiUtils';
import { tables } from '../../../lib/datamodel';
import { queryRecords } from '../../../lib/query';
import type { IR } from '../../../lib/types';

export default endpoint({
  GET: async ({ connection, query: { table } }: Payload<never, 'table'>) =>
    queryRecords<IR<unknown>>(connection, `SELECT * FROM \`${table}\``, []),
  POST: async ({
    body,
    connection,
    query: { table },
  }: Payload<IR<unknown>, 'table'>) =>
    connection
      .execute(
        `INSERT INTO \`${table}\` (${Object.keys(
          tables[table as keyof typeof tables]
        ).join(', ')}) VALUES (?, ?, ?, ?)`,
        [body.name, body.description, body.color, body.isEnabled]
      )
      .then(() => ({ status: Http.CREATED, body: '' })),
});
