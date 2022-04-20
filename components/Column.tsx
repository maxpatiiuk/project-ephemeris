import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar } from '../lib/datamodel';
import { formatUrl } from '../lib/querystring';
import type { IR, RA } from '../lib/types';
import { defined } from '../lib/types';
import {
  dateToTimeString,
  DEFAULT_EVENT_DURATION,
  MARKS_IN_DAY,
  serializeDate,
} from '../lib/utils';
import { globalText } from '../localization/global';
import { DAY, MILLISECONDS } from './Internationalization';
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
    <div className="flex-1 flex flex-col relative">
      <Link
        href={`/view/${router.query.view as string}/date/${serializeDate(
          date
        )}${
          typeof router.query.occurrenceId === 'undefined' ? '/event/add' : ''
        }`}
      >
        <a
          className="absolute w-full h-full block flex flex-col"
          aria-label={globalText('createEvent')}
          onClick={(event): void => {
            if (typeof router.query.occurrenceId !== 'undefined') return;
            event.preventDefault();
            const target = event.target as Element;
            const link =
              target.tagName === 'A'
                ? target
                : defined(target.closest('a') ?? undefined);
            const { top, height } = link.getBoundingClientRect();
            const percentage = (event.clientY - top) / height;
            const startTime =
              Math.round(
                ((DAY * MILLISECONDS) / DEFAULT_EVENT_DURATION) * percentage
              ) * DEFAULT_EVENT_DURATION;
            const eventDate = new Date(date);
            eventDate.setHours(0);
            eventDate.setMinutes(0);
            eventDate.setSeconds(0);
            eventDate.setTime(eventDate.getTime() + startTime);
            router.push(
              formatUrl(
                `/view/${router.query.view as string}/date/${serializeDate(
                  date
                )}/event/add`,
                { start: dateToTimeString(eventDate).replace(':', '_') }
              )
            );
          }}
        >
          {Array.from({ length: MARKS_IN_DAY }, (_, index) => (
            <span
              key={index}
              className="border-b border-gray-200 dark:border-neutral-900 flex-1"
            />
          ))}
        </a>
      </Link>
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
              className={`flex flex-col rounded p-1 !border-l-2
                hover:brightness-150 z-10
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
    </div>
  );
}
