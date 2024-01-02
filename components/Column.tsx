import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar } from '../lib/dataModel';
import { formatUrl } from '../lib/querystring';
import type { RA } from '../lib/types';
import { defined } from '../lib/types';
import {
  dateToString,
  dateToTimeString,
  DEFAULT_EVENT_DURATION,
  DEFAULT_MINUTE_ROUNDING,
  MARKS_IN_DAY,
  serializeDate,
} from '../lib/utils';
import { globalText } from '../localization/global';
import { DAY, HOUR, MILLISECONDS, MINUTE } from './Internationalization';
import type { OccurrenceWithEvent } from './useEvents';

function usePlacing(occurrences: RA<OccurrenceWithEvent> | undefined): RA<{
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly atomCount: number;
}> {
  return React.useMemo(() => {
    const atomCount = (MARKS_IN_DAY * HOUR) / MINUTE / DEFAULT_MINUTE_ROUNDING;
    const atoms = Array.from(
      {
        length: atomCount,
      },
      (): number[] => [],
    );
    const startDate = new Date(occurrences?.[0]?.startDateTime ?? new Date());
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    const startTime = startDate.getTime();
    const startString = dateToString(startDate);
    occurrences?.forEach(({ id, startDateTime, endDateTime }) => {
      const startAtom = Math.floor(
        ((startDateTime.getTime() - startTime) / DAY / MILLISECONDS) *
          atomCount,
      );
      const endAtom =
        startString === dateToString(endDateTime)
          ? Math.ceil(
              ((endDateTime.getTime() - startTime) / DAY / MILLISECONDS) *
                atomCount,
            )
          : atomCount;
      Array.from({ length: endAtom - startAtom }, (_, index) => {
        atoms[startAtom + index].push(id);
      });
    });

    return (
      occurrences?.map(({ id }) => {
        const startIndex = atoms.findIndex((atom) => atom.includes(id));
        const endIndex =
          atoms.length -
          Array.from(atoms)
            .reverse()
            .findIndex((atom) => atom.includes(id));
        const fraction = Math.max(
          ...atoms.slice(startIndex, endIndex).map((atom) => atom.length),
        );
        const left = Math.max(
          ...atoms.slice(startIndex, endIndex).map((atom) => atom.indexOf(id)),
        );

        return {
          top: (startIndex / atomCount) * 100,
          left: (left / fraction) * 100,
          width: (1 / fraction) * 100,
          height: ((endIndex - startIndex) / atomCount) * 100,
          atomCount: endIndex - startIndex,
        };
      }) ?? []
    );
  }, [occurrences]);
}

export function Column({
  occurrences,
  calendars,
  date,
}: {
  readonly occurrences: RA<OccurrenceWithEvent> | undefined;
  readonly calendars: RA<Calendar> | undefined;
  readonly date: Date;
}): JSX.Element {
  const router = useRouter();
  const [currentTime, setCurrentTime] = React.useState<number | undefined>(
    undefined,
  );
  const placing = usePlacing(occurrences);

  React.useEffect(() => {
    function update(): void {
      const currentDate = new Date();
      if (dateToString(currentDate) === dateToString(date)) {
        const dayStart = new Date();
        dayStart.setHours(0);
        dayStart.setMinutes(0);
        dayStart.setSeconds(0);
        setCurrentTime(
          (currentDate.getTime() - dayStart.getTime()) / DAY / MILLISECONDS,
        );
      } else setCurrentTime(undefined);
    }

    const interval = setInterval(update, MINUTE * MILLISECONDS);
    update();
    return (): void => clearInterval(interval);
  }, [date]);

  return (
    <div className="flex-1 flex flex-col relative">
      {typeof currentTime === 'number' && (
        <div
          aria-hidden={true}
          className="absolute w-full bg-red-500 h-0.5 z-10 pointer-events-none"
          style={{
            top: `${currentTime * 100}%`,
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
        </div>
      )}
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
              className="border-b border-gray-200 dark:border-neutral-700 flex-1"
            />
          ))}
        </a>
      </Link>
      {occurrences?.map(
        (
          {
            id,
            name,
            startDateTime,
            endDateTime,
            color,
            event: { calendarId },
          },
          index
        ) => (
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
                borderColor:
                  calendars?.find(({ id }) => id === calendarId)?.color ??
                  color,
                top: `${placing[index].top}%`,
                left: `${placing[index].left}%`,
                width: `${placing[index].width}%`,
                height: `${placing[index].height}%`,
              }}
              className={`rounded !border-l-2 hover:brightness-150 z-10 absolute
                flex overflow-hidden
                ${endDateTime.getTime() < Date.now() ? 'brightness-80' : ''}
                ${
                  placing[index].atomCount > 3
                    ? `flex-col p-1 ${
                        placing[index].atomCount === 4 ? 'pt-0 text-sm' : ''
                      }`
                    : 'gap-0.5 text-xs items-center whitespace-nowrap'
                }
              `}
            >
              <span>{`${name}${placing[index].atomCount > 3 ? '' : ','}`}</span>
              <span className="text-xs">
                <time
                  aria-label={globalText('from')}
                  dateTime={startDateTime.toJSON()}
                >{`${dateToTimeString(startDateTime)}`}</time>
                {' - '}
                <time
                  aria-label={globalText('till')}
                  dateTime={endDateTime.toJSON()}
                >{`${dateToTimeString(endDateTime)}`}</time>
              </span>
            </a>
          </Link>
        )
      )}
    </div>
  );
}
