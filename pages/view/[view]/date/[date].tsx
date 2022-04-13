import { useRouter } from 'next/router';
import React from 'react';

import {
  className,
  Container,
  Link,
  Select,
} from '../../../../components/Basic';
import { CalendarList } from '../../../../components/CalendarList';
import { useAsyncState } from '../../../../components/Hooks';
import { dateParts } from '../../../../components/Internationalization';
import Layout from '../../../../components/Layout';
import { MainView } from '../../../../components/MainView';
import { MiniCalendar } from '../../../../components/MiniCalendar';
import { ajax } from '../../../../lib/ajax';
import type { Calendar } from '../../../../lib/datamodel';
import { deserializeDate, serializeDate } from '../../../../lib/dateUtils';
import { useCachedState } from '../../../../lib/stateCache';
import type { RA } from '../../../../lib/types';
import { globalText } from '../../../../localization/global';

export type View = 'day' | 'week' | 'month' | 'year';

export default function Index(): JSX.Element {
  const router = useRouter();
  const view = (router.query.view as View) ?? 'week';
  const currentDate = React.useMemo(
    () =>
      deserializeDate(
        (router.query.date as string) ?? serializeDate(new Date())
      ),
    [router.query.date]
  );

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

  const previousDate = React.useMemo(() => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setFullYear(newDate.getFullYear() - 1);
    return serializeDate(newDate);
  }, [currentDate, view]);

  const nextDate = React.useMemo(() => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setFullYear(newDate.getFullYear() + 1);
    return serializeDate(newDate);
  }, [currentDate, view]);

  return (
    <Layout title={undefined}>
      <Container.Quartered>
        <header className="contents">
          <h1 className="flex items-center text-2xl">{globalText('title')}</h1>
          <div className="flex gap-2">
            <Link.LikeFancyButton
              className={className.grayButton}
              href={`/view/${view}/date/${serializeDate(new Date())}`}
            >
              {globalText('today')}
            </Link.LikeFancyButton>
            <Link.Icon
              icon="chevronLeft"
              href={`/view/${view}/date/${previousDate}`}
              title={globalText('previous')}
              aria-label={globalText('previous')}
            />
            <Link.Icon
              icon="chevronRight"
              href={`/view/${view}/date/${nextDate}`}
              title={globalText('next')}
              aria-label={globalText('next')}
            />
            <span className="flex-1 -ml-2" />
            <Select
              value={view}
              onValueChange={async (newView) =>
                router.push(`/view/${newView}/${router.query.date as string}`)
              }
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
            <MiniCalendar currentDate={currentDate} view={view} mode="aside" />
            <CalendarList
              calendars={calendars}
              enabledCalendars={enabledCalendars ?? []}
              onChange={setEnabledCalendars}
            />
          </aside>
          <MainView
            type={view}
            date={currentDate}
            enabledCalendars={enabledCalendars ?? []}
          />
        </main>
      </Container.Quartered>
    </Layout>
  );
}
