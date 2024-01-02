import type { NextApiRequest, NextApiResponse } from 'next';

import { DAY, WEEK } from '../../../../../../components/Internationalization';
import { getDaysBetween } from '../../../../../../components/useEvents';
import { Http } from '../../../../../../lib/ajax';
import type {
  EventOccurrence,
  EventTable,
} from '../../../../../../lib/dataModel';
import { f } from '../../../../../../lib/functools';
import { connectToDatabase, execute } from '../../../../../../lib/mysql';
import { queryRecord } from '../../../../../../lib/query';

export default async function endpoint(
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> {
  if (request.method !== 'POST')
    return void response.status(Http.WRONG_METHDO).send('');

  const connection = await connectToDatabase();
  const eventId = f.parseInt(
    (request.query.eventId as string | undefined) ?? ''
  );
  const occurrenceId = f.parseInt(
    (request.query.occurrenceId as string | undefined) ?? ''
  );
  if (typeof eventId === 'undefined' || typeof occurrenceId === 'undefined')
    return void response.status(Http.BAD_REQUEST).send('');
  const { event, occurrence } = await f.all({
    event: queryRecord<EventTable>(
      connection,
      'SELECT * FROM event WHERE id = ?',
      [eventId]
    ).then(({ status, body }) =>
      status === Http.NOT_FOUND ? undefined : body
    ),
    occurrence: queryRecord<EventOccurrence>(
      connection,
      'SELECT * FROM eventOccurrence WHERE id = ?',
      [occurrenceId]
    ).then(({ status, body }) =>
      status === Http.NOT_FOUND ? undefined : body
    ),
  });
  if (typeof event === 'undefined' || typeof occurrence === 'undefined')
    return void response.status(Http.NOT_FOUND).send('');

  // Delete future events
  await execute(
    connection,
    'DELETE FROM eventOccurrence WHERE eventId = ? AND startDateTime > ?',
    [event.id, occurrence.startDateTime]
  );

  // Recreate future events
  const repeatForWeeks = Math.round(
    (getDaysBetween(occurrence.startDateTime, event.endDate) / WEEK) * DAY
  );

  const weekDay = new Date(occurrence.startDateTime).getDay() + 1;
  // Rotate the string so that first day matches the day after current event's day
  const rotatedWeekDays = `${event.daysOfWeek.slice(
    weekDay
  )}${event.daysOfWeek.slice(0, weekDay)}`;
  const weekDays = rotatedWeekDays
    .split('')
    .map((day, index) => [day, index] as const)
    .filter(([day]) => day === day.toUpperCase())
    .map(([_day, index]) => index);

  const createdOccurrences = await Promise.all(
    Array.from(
      {
        length: repeatForWeeks,
      },
      (_, weekIndex) =>
        weekDays.map(async (weekDay) => {
          const startDateTime = new Date(occurrence.startDateTime);
          startDateTime.setDate(
            startDateTime.getDate() + (weekIndex * WEEK) / DAY + weekDay + 1,
          );
          const endDateTime = new Date(
            startDateTime.getTime() +
              (occurrence.endDateTime.getTime() -
                occurrence.startDateTime.getTime()),
          );
          const record = {
            name: occurrence.name,
            description: occurrence.description,
            startDateTime,
            endDateTime,
            color: occurrence.color,
            eventId: event.id,
          } as const;
          return execute<{ readonly insertId: number }>(
            connection,
            `INSERT INTO eventOccurrence (${Object.keys(record).join(', ')})
            VALUES (?, ?, ?, ?, ?, ?)`,
            Object.values(record)
          ).then(({ insertId }) => ({
            id: insertId,
            ...record,
          }));
        })
    ).flat()
  );

  return void response.status(Http.CREATED).json(createdOccurrences);
}
