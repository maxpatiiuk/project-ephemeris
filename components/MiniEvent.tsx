/**
 * Preview Event in a dialog window
 */

import { useRouter } from 'next/router';
import React from 'react';

import { ajax, Http, ping } from '../lib/ajax';
import type { Calendar, EventOccurrence, EventTable } from '../lib/dataModel';
import { replaceItem, replaceKey } from '../lib/helpers';
import type { PartialBy, RA } from '../lib/types';
import { dateToDatetimeLocal, serializeDate } from '../lib/utils';
import { globalText } from '../localization/global';
import {
  Button,
  className,
  Form,
  Input,
  Label,
  Link,
  Select,
  Submit,
  Textarea,
} from './Basic';
import { ColorPicker } from './ColorPicker';
import { EventsContext } from './Contexts';
import { crash } from './ErrorBoundary';
import { useBooleanState, useId, useTriggerState } from './Hooks';
import { icons } from './Icons';
import {
  DAY,
  MILLISECONDS,
  MINUTE,
  WEEK,
  weekDays,
} from './Internationalization';
import { Dialog } from './ModalDialog';
import { getDatesBetween, getDaysBetween } from './useEvents';

function DateTime({
  value: originalValue,
  onChange: handleChange,
}: {
  readonly value: Date;
  onChange: (date: Date) => void;
}): JSX.Element {
  const [value, setValue] = useTriggerState(dateToDatetimeLocal(originalValue));
  return (
    <Input.Generic
      className="flex-1"
      type="datetime-local"
      value={value}
      onValueChange={setValue}
      onBlur={(): void => handleChange(new Date(value))}
    />
  );
}

export function MiniEvent({
  occurrence: initialOccurrence,
  calendars,
}: {
  readonly occurrence: PartialBy<EventOccurrence, 'id' | 'eventId'>;
  readonly calendars: RA<Calendar> | undefined;
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
      calendarId: calendars?.[0]?.id,
    },
  );
  const initialEvent = React.useRef(event);

  const initialRepeatsFor = Math.max(
    0,
    Math.round((getDaysBetween(startDateTime, event.endDate) / WEEK) * DAY),
  );
  const [repeatsFor, setRepeatsFor] = React.useState(
    Number.isNaN(initialRepeatsFor) ? 0 : initialRepeatsFor,
  );

  const nameInputRef = React.useRef<HTMLInputElement | null>(null);

  const isNew = typeof id === 'undefined' || typeof eventId === 'undefined';

  const router = useRouter();
  const baseUrl = `/view/${router.query.view as string}/date/${
    router.query.date as string
  }`;
  const [isDeleting, handleDeleting, handleNotDeleting] = useBooleanState();

  async function handleSave() {
    const endDate = new Date(startDateTime);
    endDate.setDate(endDate.getDate() + (repeatsFor * WEEK) / DAY);
    setEvent(replaceKey(event, 'endDate', endDate));
    const newEvent = {
      ...event,
      startDate: startDateTime,
      endDate: endDate,
      defaultStartTime: startDateTime,
      defaultEndTime: endDateTime,
      calendarId: event.calendarId ?? calendars?.[0]?.id,
    };

    const eventChanged =
      JSON.stringify(newEvent) !== JSON.stringify(initialEvent.current);
    const occurrenceChanged =
      JSON.stringify(occurrence) !== JSON.stringify(initialOccurrence);

    const newEventId =
      typeof eventId === 'number'
        ? eventChanged
          ? await ping(`/api/table/event/${eventId}`, {
              method: 'PUT',
              body: event,
            }).then(() => eventId)
          : eventId
        : await ajax<EventTable>(
            '/api/table/event',
            {
              method: 'POST',
              body: newEvent,
              headers: { Accept: 'application/json' },
            },
            {
              expectedResponseCodes: [Http.CREATED],
            },
          ).then(({ data: { id } }) => id);

    const newId =
      typeof id === 'number'
        ? await (occurrenceChanged
            ? ping(`/api/table/eventOccurrence/${id}`, {
                method: 'PUT',
                body: occurrence,
              })
            : Promise.resolve()
          ).then(() => id)
        : await ajax<EventOccurrence>(
            '/api/table/eventOccurrence',
            {
              method: 'POST',
              body: replaceKey(occurrence, 'eventId', newEventId),
              headers: { Accept: 'application/json' },
            },
            {
              expectedResponseCodes: [Http.CREATED],
            },
          ).then(({ data: { id } }) => id);
    eventsRef.current.eventOccurrences[
      serializeDate(initialOccurrence.startDateTime)
    ] = Object.fromEntries(
      Object.entries(
        eventsRef.current.eventOccurrences[
          serializeDate(initialOccurrence.startDateTime)
        ],
      ).filter(([occurrenceId]) => occurrenceId !== newId.toString()),
    );
    eventsRef.current.eventOccurrences[serializeDate(startDateTime)] ??= {};
    eventsRef.current.eventOccurrences[serializeDate(startDateTime)][newId] = {
      ...occurrence,
      id: newId,
      eventId: newEventId,
    };
    eventsRef.current.events[newEventId] = replaceKey(event, 'id', newEventId);

    /*
     * If there were changes, delete future occurrences,
     * ask back-end to recreate them, and fetch the new
     * events
     */
    if (isNew || eventChanged || occurrenceChanged) {
      const range = [initialEvent.current.endDate, occurrence.startDateTime];
      if (
        initialEvent.current.endDate.getTime() >
        occurrence.startDateTime.getTime()
      )
        range.reverse();
      /*
       * Events to be deleted can be in the range from
       * the day after the occurrence till the last event
       * day
       */
      range[0] = new Date(range[0]);
      range[0].setDate(range[0].getDate() + 1);
      range[1] = new Date(range[1]);
      range[1].setDate(range[1].getDate() + 1 + WEEK / DAY);
      getDatesBetween(range[0], range[1])
        .filter(
          (dateString) =>
            typeof eventsRef.current.eventOccurrences[dateString] === 'object',
        )
        .forEach((dateString) => {
          eventsRef.current.eventOccurrences[dateString] = Object.fromEntries(
            Object.entries(
              eventsRef.current.eventOccurrences[dateString],
            ).filter(([_id, occurrence]) => occurrence.eventId !== newEventId),
          );
        });

      const { data: occurrences } = await ajax<RA<EventOccurrence>>(
        `/api/table/event/${newEventId}/recalculateFrom/${newId}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        },
        {
          expectedResponseCodes: [Http.CREATED],
        },
      );
      occurrences.forEach((occurrence) => {
        const date = serializeDate(new Date(occurrence.startDateTime));
        if (typeof eventsRef.current.eventOccurrences[date] === 'undefined')
          return;
        eventsRef.current.eventOccurrences[date][occurrence.id] = {
          ...occurrence,
          startDateTime: new Date(occurrence.startDateTime),
          endDateTime: new Date(occurrence.endDateTime),
        };
      });
    }

    eventsRef.current.eventTarget.trigger();
    await router.push(baseUrl);
  }

  const formId = useId('mini-event')('id');

  return (
    <>
      <Dialog
        modal={false}
        header={
          <div className="flex gap-2 items-center" aria-label={name}>
            <label title={globalText('color')} className="contents">
              <ColorPicker
                color={color}
                onChange={(color): void => {
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
                  replaceKey(occurrence, 'name', occurrence.name.trim()),
                )
              }
              aria-label={globalText('name')}
              placeholder={globalText('name')}
              required
              forwardRef={nameInputRef}
              form={formId}
            />
          </div>
        }
        headerButtons={
          <>
            <span className="flex-1 -ml-2" />
            <div className="flex gap-4">
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
        <Form id={formId} onSubmit={(): void => void handleSave().catch(crash)}>
          <div className="grid grid-cols-[auto,1fr] gap-2">
            {icons.clock}
            <span className="flex gap-2">
              <label className="flex flex-col gap-1">
                {globalText('startTime')}
                <DateTime
                  value={startDateTime}
                  onChange={(startDate): void =>
                    setOccurrence(
                      replaceKey(
                        replaceKey(occurrence, 'startDateTime', startDate),
                        'endDateTime',
                        new Date(
                          Math.max(
                            endDateTime.getTime() -
                              (startDateTime.getTime() - startDate.getTime()),
                            startDate.getTime() + MINUTE * MILLISECONDS,
                          ),
                        ),
                      ),
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="flex-1">{globalText('endTime')}</span>
                <DateTime
                  value={endDateTime}
                  onChange={(endDate): void =>
                    setOccurrence(
                      replaceKey(
                        replaceKey(occurrence, 'endDateTime', endDate),
                        'startDateTime',
                        endDate.getTime() < startDateTime.getTime()
                          ? new Date(
                              Math.min(
                                startDateTime.getTime() -
                                  (endDateTime.getTime() - endDate.getTime()),
                                endDate.getTime() - MINUTE * MILLISECONDS,
                              ),
                            )
                          : startDateTime,
                      ),
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
                      className={className.ariaHandled}
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
                                : event.daysOfWeek[index].toUpperCase(),
                            ).join(''),
                          ),
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
                  value={repeatsFor}
                  onValueChange={setRepeatsFor}
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
                required
                className="flex gap-2"
                value={event.calendarId ?? calendars?.[0]?.id ?? ''}
                onValueChange={(calendarId): void => {
                  setOccurrence(
                    replaceKey(
                      occurrence,
                      'color',
                      calendars?.find(({ id }) => id.toString() === calendarId)
                        ?.color ?? color,
                    ),
                  );
                  setEvent(
                    replaceKey(
                      replaceKey(
                        event,
                        'calendarId',
                        Number.parseInt(calendarId),
                      ),
                      'defaultColor',
                      calendars?.find(({ id }) => id.toString() === calendarId)
                        ?.color ?? event.defaultColor,
                    ),
                  );
                }}
              >
                {calendars?.map((calendar) => (
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
                    replaceKey(occurrence, 'description', description),
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
                eventsRef.current.eventOccurrences[
                  serializeDate(startDateTime)
                ],
              ).filter(([occurrenceId]) => occurrenceId !== id.toString()),
            );
            eventsRef.current.eventTarget.trigger();
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
              void ping(
                `/api/table/eventOccurrence/${occurrenceId}`,
                {
                  method: 'DELETE',
                },
                { expectedResponseCodes: [Http.NO_CONTENT] },
              ).catch(crash);
            }}
          >
            {globalText('delete')}
          </Button.Red>
        </>
      }
      onClose={handleClose}
    >
      {globalText('deleteOccurrenceDialogMessage')}
    </Dialog>
  );
}
