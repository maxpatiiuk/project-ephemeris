import React from 'react';

import { toggleItem } from '../lib/helpers';
import type { RA } from '../lib/types';
import { globalText } from '../localization/global';
import { Input, Label, Link, Ul } from './Basic';
import { CalendarsContext } from './Contexts';

export function CalendarList({
  enabledCalendars,
  onChange: handleChange,
}: {
  readonly enabledCalendars: RA<number>;
  readonly onChange: (enabledCalendars: RA<number>) => void;
}): JSX.Element {
  const calendars = React.useContext(CalendarsContext);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex">
        <h2 className="flex-1">{globalText('calendars')}</h2>
        <Link.Icon
          href="/settings/calendars"
          icon="cog"
          aria-label={globalText('edit')}
          title={globalText('edit')}
        />
      </div>
      {typeof calendars === 'object' ? (
        <Ul>
          {Object.values(calendars).map((calendar) => (
            <li key={calendar.id} title={calendar.description}>
              <Label.ForCheckbox>
                <Input.Checkbox
                  className="h-5 w-5 rounded-sm"
                  style={{ color: calendar.color }}
                  checked={enabledCalendars.includes(calendar.id)}
                  onValueChange={(): void =>
                    handleChange(toggleItem(enabledCalendars, calendar.id))
                  }
                />
                {calendar.name}
              </Label.ForCheckbox>
            </li>
          ))}
        </Ul>
      ) : (
        globalText('loading')
      )}
    </section>
  );
}
