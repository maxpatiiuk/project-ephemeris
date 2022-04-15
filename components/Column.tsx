import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar } from '../lib/datamodel';
import { f } from '../lib/functools';
import type { IR, RA } from '../lib/types';
import { serializeDate } from '../lib/utils';
import type { OccurrenceWithEvent } from './useEvents';

export function Column({
  occurrences,
  calendars,
}: {
  readonly occurrences: RA<OccurrenceWithEvent> | undefined;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const router = useRouter();
  const currentOccurrenceId = f.parseInt(router.query.occurrenceId?.[1] ?? '');
  return (
    <div className="flex-1">
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
            )}${currentOccurrenceId === id ? '' : `/event/${id}`}`}
            key={id}
          >
            <a
              style={{
                backgroundColor: color,
                borderColor: calendars?.[calendarId].color ?? color,
              }}
              className={`flex flex-col rounded p-1 !border-l-2 hover:brightness-150`}
            >
              <span>{name}</span>
              {/* TODO: add aria label */}
              <span>{`${startDateTime.getHours()}:${startDateTime.getMinutes()} - ${endDateTime.getHours()}:${endDateTime.getMinutes()}`}</span>
            </a>
          </Link>
        )
      )}
    </div>
  );
}
