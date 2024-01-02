import React from 'react';

import { dateToTimeString } from '../lib/utils';
import { globalText } from '../localization/global';
import { MILLISECONDS } from './Internationalization';

export function CurrentTime(): JSX.Element {
  const timeZoneName = React.useMemo(
    () =>
      globalText('time')(
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone.split('/')
          .slice(-1)[0],
      ),
    [],
  );

  const [time, setTime] = React.useState<string>('');
  React.useEffect(() => {
    const interval = setInterval(
      () => setTime(dateToTimeString(new Date())),
      MILLISECONDS,
    );
    setTime(dateToTimeString(new Date()));
    return (): void => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-between">
      <span>{timeZoneName}</span>
      <time dateTime={time}>{time}</time>
    </div>
  );
}
