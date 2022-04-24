import type { NextApiRequest, NextApiResponse } from 'next';

import { Http } from '../../../lib/ajax';
import { connectToDatabase } from '../../../lib/mysql';
import { queryRecords } from '../../../lib/query';

export default async function endpoint(
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> {
  if (request.method !== 'GET')
    return void response.status(Http.WRONG_METHDO).send('');

  const connection = await connectToDatabase();

  return queryRecords<{
    readonly calendarId: number;
    readonly occurrenceCount: string;
  }>(
    connection,
    `   SELECT calendar.id AS 'calendarId',
               SUM((
                   SELECT COUNT(*)
                     FROM eventOccurrence
                    WHERE eventOccurrence.eventId = event.id
               )) AS 'occurrenceCount'
          FROM calendar
    INNER JOIN event
            ON event.calendarId = calendar.id
      GROUP BY calendar.id;`,
    []
  )
    .then(({ body }) =>
      Object.fromEntries(
        body.map(({ calendarId, occurrenceCount }) => [
          calendarId,
          Number.parseInt(occurrenceCount),
        ])
      )
    )
    .then((payload) => response.status(Http.OK).json(payload));
}
