import { useRouter } from 'next/router';
import React from 'react';

import {
  className,
  Container,
  Link,
  Select,
} from '../../../../../components/Basic';
import { CalendarList } from '../../../../../components/CalendarList';
import { CurrentTime } from '../../../../../components/CurrentTime';
import { useAsyncState } from '../../../../../components/Hooks';
import Layout from '../../../../../components/Layout';
import { MainView } from '../../../../../components/MainView';
import { MiniCalendar } from '../../../../../components/MiniCalendar';
import { SearchBar } from '../../../../../components/SearchBar';
import { ajax } from '../../../../../lib/ajax';
import type { Calendar } from '../../../../../lib/dataModel';
import { formatUrl } from '../../../../../lib/querystring';
import { useCachedState } from '../../../../../lib/stateCache';
import type { IR, RA } from '../../../../../lib/types';
import { deserializeDate, serializeDate } from '../../../../../lib/utils';
import { globalText } from '../../../../../localization/global';

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

  const [calendars] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<RA<Calendar>>(
          formatUrl('/api/table/calendar', { orderBy: 'name' }),
          {
            headers: { Accept: 'application/json' },
          }
        ).then(({ data }) => data),
      []
    ),
    false
  );

  const [disabledCalendars, setDisabledCalendars] = useCachedState({
    bucketName: 'main',
    cacheName: 'disabledCalendars',
    bucketType: 'localStorage',
    defaultValue: [],
    staleWhileRefresh: false,
  });
  const enabledCalendars = React.useMemo(
    () =>
      Array.isArray(disabledCalendars) && typeof calendars === 'object'
        ? calendars
            .filter(({ id }) => !disabledCalendars.includes(id))
            .map(({ id }) => id)
        : undefined,
    [disabledCalendars, calendars]
  );

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const interactiveElements = ['input', 'button', 'textarea'];
      if (
        interactiveElements.some(
          (tagName) => (event.target as Element)?.closest(tagName) !== null
        )
      )
        return;
      const actions: IR<() => void> = {
        KeyT: async () =>
          router.push(`/view/${view}/date/${serializeDate(new Date())}`),
        KeyD: async () =>
          router.push(`/view/day/date/${serializeDate(currentDate)}`),
        KeyW: async () =>
          router.push(`/view/week/date/${serializeDate(currentDate)}`),
        KeyM: async () =>
          router.push(`/view/month/date/${serializeDate(currentDate)}`),
        KeyY: async () =>
          router.push(`/view/year/date/${serializeDate(currentDate)}`),
        KeyN: async () => router.push(`/view/${view}/date/${nextDate}`),
        KeyP: async () => router.push(`/view/${view}/date/${previousDate}`),
      };
      if (event.code in actions) {
        event.preventDefault();
        actions[event.code]?.();
      }
    }

    document.body.addEventListener('keydown', handleKeyDown);
    return (): void =>
      document.body.removeEventListener('keydown', handleKeyDown);
  }, [router, view, currentDate, nextDate, previousDate]);

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
            <SearchBar currentDate={currentDate} />
            <span className="flex-1 -ml-2" />
            <Select
              value={view}
              onValueChange={async (newView) =>
                router.push(
                  `/view/${newView}/date/${router.query.date as string}`
                )
              }
            >
              {Object.entries({
                day: globalText('day'),
                week: globalText('week'),
                month: globalText('month'),
                year: globalText('year'),
              }).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </header>
        <aside className="flex flex-col gap-4">
          <MiniCalendar currentDate={currentDate} mode="aside" />
          <CurrentTime />
          <CalendarList
            disabledCalendars={disabledCalendars ?? []}
            onChange={setDisabledCalendars}
            calendars={calendars}
          />
        </aside>
        <MainView
          view={view}
          date={currentDate}
          enabledCalendars={enabledCalendars ?? []}
          calendars={calendars}
        />
      </Container.Quartered>
    </Layout>
  );
}
