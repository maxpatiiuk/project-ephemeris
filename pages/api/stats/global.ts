import type { NextApiRequest, NextApiResponse } from 'next';

import { Http } from '../../../lib/ajax';
import { connectToDatabase } from '../../../lib/mysql';
import { queryRecords } from '../../../lib/query';
import { inMemory } from '../../../lib/inMemoryDatabase';

export default async function endpoint(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  if (request.method !== 'GET')
    return void response.status(Http.WRONG_METHOD).send('');

  const connection = await connectToDatabase();

  const responseData =
    connection === undefined
      ? inMemory.countEvents()
      : await queryRecords<{
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
          [],
        ).then(({ body }) =>
          Object.fromEntries(
            body.map(({ calendarId, occurrenceCount }) => [
              calendarId,
              Number.parseInt(occurrenceCount),
            ]),
          ),
        );

  return response.status(Http.OK).json(responseData);
}
