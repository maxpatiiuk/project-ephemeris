import React from 'react';

import type { Calendar } from '../lib/dataModel';
import { toggleItem } from '../lib/helpers';
import type { IR, RA } from '../lib/types';
import { globalText } from '../localization/global';
import { Input, Label, Link, Ul } from './Basic';

export function CalendarList({
  disabledCalendars,
  onChange: handleChange,
  calendars,
}: {
  readonly disabledCalendars: RA<number>;
  readonly onChange: (disabledCalendars: RA<number>) => void;
  readonly calendars: IR<Calendar> | undefined;
}): JSX.Element {
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
                  checked={!disabledCalendars.includes(calendar.id)}
                  onValueChange={(): void =>
                    handleChange(toggleItem(disabledCalendars, calendar.id))
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
