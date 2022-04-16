import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar } from '../lib/datamodel';
import type { IR, RA } from '../lib/types';
import { serializeDate } from '../lib/utils';
import { globalText } from '../localization/global';
import type { OccurrenceWithEvent } from './useEvents';

export function Column({
  occurrences,
  calendars,
  date,
}: {
  readonly occurrences: RA<OccurrenceWithEvent> | undefined;
  readonly calendars: IR<Calendar> | undefined;
  readonly date: Date;
}): JSX.Element {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col">
      {occurrences?.map(
        ({
          id,
          name,
          startDateTime,
          endDateTime,
          color,
          event: { calendarId },
        }) => (
          <Link
            href={`/view/${router.query.view as string}/date/${serializeDate(
              startDateTime
            )}${
              typeof router.query.occurrenceId === 'undefined'
                ? `/event/${id}`
                : ''
            }`}
            key={id}
          >
            <a
              style={{
                backgroundColor: color,
                borderColor: calendars?.[calendarId].color ?? color,
              }}
              className={`flex flex-col rounded p-1 !border-l-2 hover:brightness-150
                ${endDateTime.getTime() < Date.now() ? 'brightness-80' : ''}`}
            >
              <span>{name}</span>
              <span>
                <time
                  aria-label={globalText('from')}
                  dateTime={startDateTime.toJSON()}
                >{`${startDateTime.getHours()}:${startDateTime.getMinutes()}`}</time>
                {' - '}
                <time
                  aria-label={globalText('till')}
                  dateTime={endDateTime.toJSON()}
                >{`${endDateTime.getHours()}:${endDateTime.getMinutes()}`}</time>
              </span>
            </a>
          </Link>
        )
      )}
      <Link
        href={`/view/${router.query.view as string}/date/${serializeDate(
          date
        )}${
          typeof router.query.occurrenceId === 'undefined' ? '/event/add' : ''
        }`}
      >
        <a
          className="flex-1 block"
          aria-label={globalText('createEvent')}
          title={globalText('createEvent')}
        />
      </Link>
    </div>
  );
}
