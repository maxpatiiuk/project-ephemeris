import type { Connection } from 'mysql2/promise';

import type { ResponsePayload } from './apiUtils';
import { Http } from './apiUtils';
import { f } from './functools';
import type { RA } from './types';

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
  body: await connection
    .execute(sql, args)
    .then(([data]) => data as unknown as RA<TYPE>),
});
