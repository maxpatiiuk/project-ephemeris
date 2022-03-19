import React from 'react';

import { className } from './Basic';

export function DayView({
  currentDate,
}: {
  readonly currentDate: Date;
}): JSX.Element {
  return (
    <div className="flex-1 border flex flex-col gap-1">
      <div className="flex gap-1 p-1 border-b">
        <div className="flex-1">
          {currentDate.toLocaleString(window.navigator.language, {
            weekday: 'long',
          })}
        </div>
        <div className={`${className.miniCalendarDay} bg-brand-100`}>
          {currentDate.getDate()}
        </div>
        <div className="flex-1" />
      </div>
    </div>
  );
}
