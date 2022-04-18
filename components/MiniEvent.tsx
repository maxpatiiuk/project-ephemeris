import { useRouter } from 'next/router';
import React from 'react';

import { ajax, Http, ping } from '../lib/ajax';
import type { Calendar, EventOccurrence, EventTable } from '../lib/datamodel';
import { f } from '../lib/functools';
import { replaceItem, replaceKey } from '../lib/helpers';
import type { IR, PartialBy, RA } from '../lib/types';
import {
  dateToDatetimeLocal,
  parseDateTimeLocal,
  serializeDate,
} from '../lib/utils';
import { globalText } from '../localization/global';
import {
  Button,
  Form,
  Input,
  Label,
  Link,
  Select,
  Submit,
  Textarea,
} from './Basic';
import { EventsContext } from './Contexts';
import { crash } from './ErrorBoundary';
import { useBooleanState } from './Hooks';
import { iconClassName, icons } from './Icons';
import { DAY, WEEK, weekDays } from './Internationalization';
import { Dialog } from './ModalDialog';
import { getDatesBetween, getDaysBetween } from './useEvents';

export function MiniEvent({
  occurrence: initialOccurrence,
  calendars,
}: {
  readonly occurrence: PartialBy<EventOccurrence, 'id' | 'eventId'>;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const [occurrence, setOccurrence] = React.useState(initialOccurrence);
  const { id, name, startDateTime, endDateTime, color, description, eventId } =
    occurrence;

  const eventsRef = React.useContext(EventsContext);
  const [event, setEvent] = React.useState<EventTable>(
    eventsRef.current.events[eventId ?? ''] ?? {
      id: undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      defaultStartTime: startDateTime,
      defaultEndTime: endDateTime,
      daysOfWeek: 'smtwtfs',
      defaultColor: color,
      calendarId: Object.values(calendars ?? {})[0]?.id,
    }
  );
  const initialEvent = React.useRef(event);

  const nameInputRef = React.useRef<HTMLInputElement | null>(null);

  const isNew = typeof id === 'number' && typeof eventId === 'number';

  const router = useRouter();
  const baseUrl = `/view/${router.query.view as string}/date/${
    router.query.date as string
  }`;
  const [isDeleting, handleDeleting, handleNotDeleting] = useBooleanState();
  return (
    <>
      <Dialog
        modal={false}
        header={
          <div className="flex gap-2 items-center" aria-label={name}>
            <label title={globalText('color')} className="contents">
              <span
                className={`${iconClassName} rounded-full`}
                style={{
                  backgroundColor: color,
                }}
              />
              <span className="sr-only">{globalText('color')}</span>
              <Input.Generic
                className={`sr-only`}
                type="color"
                value={color}
                onValueChange={(color): void => {
                  setOccurrence(replaceKey(occurrence, 'color', color));
                  setEvent(replaceKey(event, 'defaultColor', color));
                }}
              />
            </label>
            <Input.Text
              value={name}
              onValueChange={(name): void =>
                setOccurrence(replaceKey(occurrence, 'name', name))
              }
              onBlur={(): void =>
                setOccurrence((occurrence) =>
                  replaceKey(occurrence, 'name', occurrence.name.trim())
                )
              }
              aria-label={globalText('name')}
              placeholder={globalText('name')}
              required
              forwardRef={nameInputRef}
            />
          </div>
        }
        headerButtons={
          <>
            <span className="flex-1 -ml-2" />
            <div className="flex flex gap-4">
              <Button.Icon
                icon="trash"
                aria-label={globalText('delete')}
                title={globalText('delete')}
                onClick={
                  typeof id === 'undefined'
                    ? (): void => void router.push(baseUrl).catch(crash)
                    : handleDeleting
                }
              />
              <Link.Icon
                icon="x"
                href={baseUrl}
                aria-label={globalText('close')}
                title={globalText('close')}
              />
            </div>
          </>
        }
        onClose={(): void => void router.push(baseUrl).catch(crash)}
        buttons={undefined}
      >
        <Form
          onSubmit={(): void =>
            void (nameInputRef.current?.validity.valid === false
              ? nameInputRef.current?.reportValidity()
              : f.var(
                  JSON.stringify(event) ===
                    JSON.stringify(initialEvent.current) &&
                    JSON.stringify(occurrence) ===
                      JSON.stringify(initialOccurrence),
                  async (hasChanged) =>
                    (isNew
                      ? // Update existing event and eventOccurrence if changed
                        (hasChanged
                          ? Promise.resolve()
                          : ping(`/api/table/event/${eventId}`, {
                              method: 'PUT',
                              body: event,
                            }).then(async () =>
                              ping(`/api/table/eventOccurrence/${id}`, {
                                method: 'PUT',
                                body: occurrence,
                              })
                            )
                        ).then(() => [id, eventId] as const)
                      : // Or, create new event and eventOccurrence if don't exist
                        ajax<EventTable>(
                          '/api/table/event',
                          {
                            method: 'POST',
                            body: replaceKey(
                              event,
                              'calendarId',
                              event.calendarId ??
                                Object.values(calendars ?? {})[0]?.id
                            ),
                            headers: { Accept: 'application/json' },
                          },
                          {
                            expectedResponseCodes: [Http.CREATED],
                          }
                        ).then(async ({ data: { id: eventId } }) =>
                          ajax<EventOccurrence>(
                            '/api/table/eventOccurrence',
                            {
                              method: 'POST',
                              body: replaceKey(occurrence, 'eventId', eventId),
                              headers: { Accept: 'application/json' },
                            },
                            {
                              expectedResponseCodes: [Http.CREATED],
                            }
                          ).then(({ data }) => [data.id, eventId])
                        )
                    )
                      .then(async ([id, eventId]) => {
                        eventsRef.current.eventOccurrences[
                          serializeDate(initialOccurrence.startDateTime)
                        ] = Object.fromEntries(
                          Object.entries(
                            eventsRef.current.eventOccurrences[
                              serializeDate(initialOccurrence.startDateTime)
                            ]
                          ).filter(
                            ([occurrenceId]) => occurrenceId === id.toString()
                          )
                        );
                        eventsRef.current.eventOccurrences[
                          serializeDate(startDateTime)
                        ] ??= {};
                        eventsRef.current.eventOccurrences[
                          serializeDate(startDateTime)
                        ][id] = { ...occurrence, id, eventId };
                        eventsRef.current.events[eventId] = replaceKey(
                          event,
                          'calendarId',
                          event.calendarId ??
                            Object.values(calendars ?? {})[0]?.id
                        );

                        /*
                         * If there were changes, delete future occurrences,
                         * ask back-end to recreate them, and fetch the new
                         * events
                         */
                        if (isNew || hasChanged) {
                          getDatesBetween(
                            initialEvent.current.endDate,
                            event.endDate
                          )
                            .filter(
                              (dateString) =>
                                typeof eventsRef.current.eventOccurrences[
                                  dateString
                                ] === 'undefined'
                            )
                            .forEach((dateString) => {
                              eventsRef.current.eventOccurrences[dateString] =
                                Object.fromEntries(
                                  Object.entries(
                                    eventsRef.current.eventOccurrences[
                                      dateString
                                    ]
                                  ).filter(
                                    ([_id, occurrence]) =>
                                      occurrence.eventId !== eventId
                                  )
                                );
                            });

                          return ajax<RA<EventOccurrence>>(
                            `/api/table/event/${eventId}/recalculateFrom/${id}`,
                            {
                              method: 'POST',
                              headers: { Accept: 'application/json' },
                            },
                            {
                              expectedResponseCodes: [Http.CREATED],
                            }
                          ).then(async ({ data: occurrences }) =>
                            occurrences.forEach((occurrence) => {
                              eventsRef.current.eventOccurrences[
                                serializeDate(occurrence.startDateTime)
                              ] ??= {};
                              eventsRef.current.eventOccurrences[
                                serializeDate(occurrence.startDateTime)
                              ][occurrence.id] = occurrence;
                            })
                          );
                        } else return undefined;
                      })
                      .then(async () => router.push(baseUrl).catch(crash))
                      .catch(crash)
                ))
          }
        >
          <div className="grid grid-cols-[auto,1fr] gap-2">
            {icons.clock}
            <span className="flex gap-2">
              <label className="flex flex-col gap-1">
                {globalText('startTime')}
                <Input.Generic
                  className="flex-1"
                  type="datetime-local"
                  value={dateToDatetimeLocal(startDateTime)}
                  onValueChange={(dateString): void => {
                    const startDate = parseDateTimeLocal(dateString);
                    setOccurrence(
                      replaceKey(
                        replaceKey(occurrence, 'startDateTime', startDate),
                        'endDateTime',
                        new Date(
                          Math.max(
                            endDateTime.getTime() -
                              (startDateTime.getTime() - startDate.getTime()),
                            startDate.getTime()
                          )
                        )
                      )
                    );
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="flex-1">{globalText('endTime')}</span>
                <Input.Generic
                  type="datetime-local"
                  value={dateToDatetimeLocal(endDateTime)}
                  onValueChange={(date): void =>
                    setOccurrence(
                      replaceKey(
                        occurrence,
                        'endDateTime',
                        parseDateTimeLocal(date)
                      )
                    )
                  }
                />
              </label>
            </span>
            {icons.refresh}
            <span className="flex flex-col gap-2">
              {globalText('repeatsEvery')}
              <span className="flex gap-2">
                {weekDays.map((name, index) => {
                  const isEnabled =
                    event.daysOfWeek[index].toUpperCase() ===
                    event.daysOfWeek[index];
                  const Component = isEnabled ? Button.Blue : Button.Gray;
                  return (
                    <Component
                      aria-pressed={isEnabled}
                      key={index}
                      onClick={(): void =>
                        setEvent(
                          replaceKey(
                            event,
                            'daysOfWeek',
                            replaceItem(
                              event.daysOfWeek.split(''),
                              index,
                              isEnabled
                                ? event.daysOfWeek[index].toLowerCase()
                                : event.daysOfWeek[index].toUpperCase()
                            ).join('')
                          )
                        )
                      }
                    >
                      {name[0]}
                    </Component>
                  );
                })}
              </span>
            </span>
            {icons.hashtag}
            <Label.Generic className="gap-2">
              {globalText('repeatsFor')}
              <div className="flex gap-2 items-center">
                <Input.Number
                  className="flex-1"
                  value={Math.max(
                    0,
                    getDaysBetween(startDateTime, event.endDate)
                  )}
                  onValueChange={(weeks: number): void => {
                    const endDate = new Date(startDateTime);
                    endDate.setDate(endDate.getDate() + (weeks / WEEK) * DAY);
                    setEvent(replaceKey(event, 'endDate', endDate));
                  }}
                  min={0}
                  max={40}
                />
                {globalText('weeks')}
              </div>
            </Label.Generic>
            {icons.calendar}
            <Label.Generic className="gap-2">
              {globalText('calendar')}
              <Select
                className="flex gap-2"
                value={
                  event.calendarId ??
                  Object.values(calendars ?? [])[0]?.id ??
                  ''
                }
                onValueChange={(calendarId): void => {
                  setOccurrence(
                    replaceKey(
                      occurrence,
                      'color',
                      calendars?.[calendarId]?.color ?? color
                    )
                  );
                  setEvent(
                    replaceKey(
                      replaceKey(
                        event,
                        'calendarId',
                        Number.parseInt(calendarId)
                      ),
                      'defaultColor',
                      calendars?.[calendarId]?.color ?? event.defaultColor
                    )
                  );
                }}
              >
                {Object.values(calendars ?? []).map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </Select>
            </Label.Generic>
            {icons.annotation}
            <Label.Generic>
              {globalText('description')}
              <Textarea
                value={description}
                onValueChange={(description): void =>
                  setOccurrence(
                    replaceKey(occurrence, 'description', description)
                  )
                }
              />
            </Label.Generic>
          </div>
          <div className="flex justify-end">
            <Submit.Green disabled={typeof calendars === 'undefined'}>
              {globalText('save')}
            </Submit.Green>
          </div>
        </Form>
      </Dialog>
      {isDeleting && typeof id === 'number' ? (
        <DeleteDialog
          onClose={handleNotDeleting}
          occurrenceId={id}
          onDeleted={(): void => {
            eventsRef.current.eventOccurrences[
              serializeDate(initialOccurrence.startDateTime)
            ] = Object.fromEntries(
              Object.entries(
                eventsRef.current.eventOccurrences[serializeDate(startDateTime)]
              ).filter(([occurrenceId]) => occurrenceId !== id.toString())
            );
            void router.push(baseUrl).catch(crash);
          }}
        />
      ) : undefined}
    </>
  );
}

export function DeleteDialog({
  onClose: handleClose,
  occurrenceId,
  onDeleted: handleDeleted,
}: {
  readonly onClose: () => void;
  readonly occurrenceId: number;
  readonly onDeleted: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={globalText('deleteOccurrenceDialogTitle')}
      buttons={
        <>
          <Button.DialogClose>{globalText('cancel')}</Button.DialogClose>
          <Button.Red
            onClick={(): void => {
              handleDeleted();
              void ping(`/api/table/eventOccurrence/${occurrenceId}`, {
                method: 'DELETE',
              }).catch(crash);
            }}
          >
            ${globalText('delete')}
          </Button.Red>
        </>
      }
      onClose={handleClose}
    >
      {globalText('deleteOccurrenceDialogMessage')}
    </Dialog>
  );
}
