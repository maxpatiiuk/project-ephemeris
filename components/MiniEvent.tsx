import { useRouter } from 'next/router';
import React from 'react';

import type { Calendar, EventOccurrence } from '../lib/datamodel';
import { replaceKey } from '../lib/helpers';
import type { IR } from '../lib/types';
import { globalText } from '../localization/global';
import { Button, Form, Link, Submit, Textarea } from './Basic';
import { EventsContext } from './Contexts';
import { crash } from './ErrorBoundary';
import { useBooleanState } from './Hooks';
import { iconClassName, icons } from './Icons';
import { Dialog } from './ModalDialog';

export function MiniEvent({
  occurrence: initialOccurrence,
  calendars,
}: {
  readonly occurrence: EventOccurrence;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
  const [occurrence, setOccurrence] = React.useState(initialOccurrence);
  const { name, startDateTime, endDateTime, color, description, eventId } =
    occurrence;

  const eventsRef = React.useContext(EventsContext);
  const event = eventsRef.current.events[eventId];
  const calendar = calendars?.[event?.calendarId ?? ''];

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
            <div
              aria-hidden={true}
              className={`${iconClassName} rounded`}
              style={{
                backgroundColor: color,
              }}
            />
            {name}
          </div>
        }
        headerButtons={
          <>
            <span className="flex-1 -ml-2" />
            <div className="flex flex gap-2">
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
          <div className="flex gap-2">
            {icons.clock}
            <time
              aria-label={globalText('from')}
              dateTime={startDateTime.toJSON()}
            >{`${startDateTime.toDateString()}, ${startDateTime.getHours()}:${startDateTime.getMinutes()}`}</time>
            {' - '}
            <time
              aria-label={globalText('till')}
              dateTime={endDateTime.toJSON()}
            >{`${
              startDateTime.getDate() === endDateTime.getDate()
                ? ''
                : `${startDateTime.toDateString()},`
            } ${endDateTime.getHours()}:${endDateTime.getMinutes()}`}</time>
          </div>
          <span className="flex gap-2">
            <span
              aria-label={globalText('calendar')}
              title={globalText('calendar')}
            >
              {icons.calendar}
            </span>
            {calendar?.name}
          </span>
          <Textarea
            value={description}
            onValueChange={(description): void =>
              setOccurrence(replaceKey(occurrence, 'description', description))
            }
          />
          <div>
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
