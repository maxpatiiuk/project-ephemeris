import mysql from 'mysql2/promise';

import { f } from './functools';
import type { RA } from './types';

let connectionPromise: Promise<void> | undefined = undefined;

const reconnectTimeout = 10_000;

function makeConnection() {
  connectionPromise = mysql
    .createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    })
    .then((resolved) => {
      connection = resolved.on('error', reconnect);
    })
    .catch(reconnect);
}

function reconnect(error: string): never {
  connection?.destroy();
  connection = undefined!;
  connectionPromise = undefined;
  setTimeout(makeConnection, reconnectTimeout);
  throw new Error(error.toString());
}

makeConnection();

export let connection: mysql.Connection;

export async function connectToDatabase(): Promise<mysql.Connection> {
  if (typeof connection === 'undefined') await connectionPromise;
  return connection;
}

export const execute = async <TYPE>(
  connection: mysql.Connection,
  sql: string,
  args: RA<unknown> = []
): Promise<RA<TYPE>> =>
  f.log(`QUERY: ${sql}. ARGUMENTS: `, ...args) ??
  connection.execute(sql, args).then(([data]) => data as unknown as RA<TYPE>);
