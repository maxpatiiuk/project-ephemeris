import React from 'react';

import type { RA } from '../lib/types';
import type { OccurrenceWithEvent } from './useEvents';

export function Column({
  occurrences,
}: {
  readonly occurrences: RA<OccurrenceWithEvent> | undefined;
}): JSX.Element {
  return (
    <div className="flex-1">
      {occurrences?.map(({ id, name, startDateTime, endDateTime, color }) => (
        <p
          key={id}
          style={{ backgroundColor: color }}
          className="flex flex-col rounded p-1"
        >
          <span>{name}</span>
          <span>{`${startDateTime.getHours()}:${startDateTime.getMinutes()} - ${endDateTime.getHours()}:${endDateTime.getMinutes()}`}</span>
        </p>
      ))}
    </div>
  );
}
