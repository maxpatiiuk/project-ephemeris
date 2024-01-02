import type { NextApiRequest, NextApiResponse } from 'next';

import { Http } from '../../../../../lib/ajax';
import type { EventOccurrence } from '../../../../../lib/dataModel';
import { connectToDatabase, execute } from '../../../../../lib/mysql';
import type { RA } from '../../../../../lib/types';
import { deserializeDate } from '../../../../../lib/utils';

export default async function endpoint(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  if (request.method !== 'POST')
    return void response.status(Http.WRONG_METHOD).send('');

  const connection = await connectToDatabase();
  const searchQuery = (request.query.query as string | undefined) ?? '';
  const rawDate = (request.query.date as string | undefined) ?? '';
  const currentDate = deserializeDate(rawDate);
  if (searchQuery.length === 0 || Number.isNaN(currentDate))
    return void response.status(Http.BAD_REQUEST).send('');

  const records = await execute<
    RA<EventOccurrence & { readonly recurring: 1 | 0 }>
  >(
    connection,
    `    SELECT eventOccurrence.*,
                IF(
                  BINARY event.daysOfWeek != BINARY LOWER(event.daysOfWeek)
                  AND DATEDIFF(event.endDate,event.startDate) > 0,
                  true,
                  false
                ) 'recurring'
           FROM eventOccurrence
     INNER JOIN event ON event.id = eventOccurrence.eventId
          WHERE eventOccurrence.name LIKE ?
       ORDER BY ABS(DATEDIFF(startDateTime,?) + 1)`,
    [`%${searchQuery}%`, currentDate]
  );

  return void response.status(Http.OK).json(records);
}
