import React from 'react';

import { Button, Container, Select } from '../components/Basic';
import { CalendarList } from '../components/CalendarList';
import { useAsyncState } from '../components/Hooks';
import { dateParts } from '../components/Internationalization';
import Layout from '../components/Layout';
import { MainView } from '../components/MainView';
import { MiniCalendar } from '../components/MiniCalendar';
import { ajax } from '../lib/ajax';
import type { Calendar } from '../lib/datamodel';
import { useCachedState } from '../lib/stateCache';
import type { RA } from '../lib/types';
import { globalText } from '../localization/global';

export type View = 'day' | 'week' | 'month' | 'year';

/*
 * TODO: 2 queries with joins
 * TODO: go though all files and remove everything unused
 */

export default function Index(): JSX.Element {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<View>('week');

  const [calendars] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<RA<Calendar>>('/api/table/calendar', {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      []
    ),
    false
  );
  const [enabledCalendars, setEnabledCalendars] = useCachedState({
    bucketName: 'main',
    cacheName: 'enabledCalendars',
    bucketType: 'localStorage',
    defaultValue: [],
    staleWhileRefresh: false,
  });

  return (
    <Layout title={undefined}>
      <Container.Quartered>
        <header className="contents">
          <h1 className="flex items-center text-2xl">{globalText('title')}</h1>
          <div className="flex gap-2">
            <Button.Gray onClick={(): void => setCurrentDate(new Date())}>
              {globalText('today')}
            </Button.Gray>
            <span className="flex-1 -ml-2" />
            <Select
              value={view}
              onChange={({ target }): void => setView(target.value as View)}
            >
              {Object.entries({
                day: dateParts.day,
                week: dateParts.week,
                month: dateParts.month,
                year: dateParts.year,
              }).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </header>
        <main className="contents">
          <aside className="flex flex-col gap-4">
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
              mode="aside"
            />
            <CalendarList
              calendars={calendars}
              enabledCalendars={enabledCalendars ?? []}
              onChange={setEnabledCalendars}
            />
          </aside>
          <MainView
            type={view}
            date={currentDate}
            onViewChange={setView}
            onDateSelect={setCurrentDate}
            enabledCalendars={enabledCalendars ?? []}
          />
        </main>
      </Container.Quartered>
    </Layout>
  );
}
