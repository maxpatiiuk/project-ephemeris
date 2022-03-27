import React from 'react';

import type { RA } from '../lib/types';

export function Column({
  date,
  enabledCalendars,
}: {
  readonly date: Date;
  readonly enabledCalendars: RA<number>;
}): JSX.Element {
  return <div className="flex-1" />;
}
