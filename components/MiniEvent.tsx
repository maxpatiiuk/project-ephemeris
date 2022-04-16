import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar, EventOccurrence, EventTable } from '../lib/datamodel';
import { replaceItem, replaceKey } from '../lib/helpers';
import type { IR, PartialBy } from '../lib/types';
import { dateToDatetimeLocal } from '../lib/utils';
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
import { weekDays } from './Internationalization';
import { Dialog } from './ModalDialog';
import { getDaysBetween } from './useEvents';

export function MiniEvent({
  occurrence: initialOccurrence,
  calendars,
}: {
  readonly occurrence: PartialBy<EventOccurrence, 'id' | 'eventId'>;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const [occurrence, setOccurrence] = React.useState(initialOccurrence);
  const { name, startDateTime, endDateTime, color, description, eventId } =
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
      calendarId: undefined,
    }
  );

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
          <div className="flex gap-2 items-center">
            <div className={`${iconClassName} relative`}>
              <div className="absolute bottom-0 h-0 min-h-2.5 ml-1/6">
                <img
                  src={
                    'data:image/svg+xml,%3Csvg ' +
                    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"/%3E'
                  }
                  alt=""
                  className="block h-full w-auto"
                />
                <label title={globalText('color')}>
                  <span
                    className="absolute inset-0 h-full w-auto rounded-full"
                    style={{
                      backgroundColor: color,
                    }}
                  />
                  <Input.Generic
                    className={`sr-only`}
                    aria-label={globalText('color')}
                    type="color"
                    value={color}
                    onValueChange={(color): void => {
                      setOccurrence(replaceKey(occurrence, 'color', color));
                      setEvent(replaceKey(event, 'defaultColor', color));
                    }}
                  />
                </label>
              </div>
            </div>
            <Input.Text
              value={name}
              onValueChange={(name): void =>
                setOccurrence(replaceKey(occurrence, 'name', name))
              }
              aria-label={globalText('name')}
              placeholder={globalText('name')}
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
                onClick={handleDeleting}
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
          onSubmit={(): void => {
            alert('Submitted');
            // TODO: finish this
          }}
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
                    setOccurrence(
                      replaceKey(
                        occurrence,
                        'startDateTime',
                        new Date(dateString)
                      )
                    );
                    setOccurrence(
                      replaceKey(
                        occurrence,
                        'endDateTime',
                        new Date(
                          endDateTime.getTime() -
                            (new Date(dateString).getTime() -
                              startDateTime.getTime())
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
                      replaceKey(occurrence, 'endDateTime', new Date(date))
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
                    event.daysOfWeek[index].toLowerCase() !==
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
                  value={getDaysBetween(startDateTime, event.endDate)}
                  onValueChange={(days: number): void => {
                    const endDate = new Date(startDateTime);
                    endDate.setDate(endDate.getDate() + days);
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
                onValueChange={(calendarId): void =>
                  setEvent(
                    replaceKey(event, 'calendarId', Number.parseInt(calendarId))
                  )
                }
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
            <Submit.Green>{globalText('save')}</Submit.Green>
          </div>
        </Form>
      </Dialog>
      {isDeleting && <DeleteDialog onClose={handleNotDeleting} />}
    </>
  );
}

export function DeleteDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={globalText('deleteOccurrenceDialogTitle')}
      buttons={
        <>
          <Button.DialogClose>{globalText('cancel')}</Button.DialogClose>
          <Button.Red
            onClick={(): void => {
              alert('TODO: implement');
              // TODO: implement
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
