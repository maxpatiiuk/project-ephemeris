import mysql from 'mysql2/promise';

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

export async function connectToDatabase() {
  if (typeof connection === 'undefined') await connectionPromise;
  return connection;
}
