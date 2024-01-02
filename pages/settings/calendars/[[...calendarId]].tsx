import { useRouter } from 'next/router';
import React from 'react';

import {
  className,
  Container,
  Form,
  Link,
  Submit,
  Ul,
} from '../../../components/Basic';
import { CalendarView } from '../../../components/CalendarView';
import { LoadingContext } from '../../../components/Contexts';
import { useAsyncState, useLiveState } from '../../../components/Hooks';
import { icons } from '../../../components/Icons';
import Layout from '../../../components/Layout';
import { ajax, Http, ping } from '../../../lib/ajax';
import type { Calendar } from '../../../lib/dataModel';
import { f } from '../../../lib/functools';
import type { IR, RA } from '../../../lib/types';
import { globalText } from '../../../localization/global';
import { formatUrl } from '../../../lib/querystring';

export function useCalendars() {
  return useAsyncState<RA<Calendar>>(
    React.useCallback(
      async () =>
        ajax<RA<Calendar>>(
          formatUrl('/api/table/calendar', { orderBy: 'name' }),
          {
            headers: { Accept: 'application/json' },
          },
        ).then(({ data }) => data),
      [],
    ),
    true,
  )[0];
}

export default function Calendars(): JSX.Element {
  const calendars = useCalendars();

  const router = useRouter();
  const rawCalendarId =
    (router.query.calendarId as RA<string> | undefined)?.[0] ?? '';
  const selectedCalendar =
    f.parseInt(rawCalendarId) ?? (rawCalendarId === 'new' ? 'new' : undefined);
  const [calendar, setCalendar] = useLiveState(
    React.useCallback(
      () =>
        typeof selectedCalendar === 'undefined'
          ? typeof calendars === 'object'
            ? Object.values(calendars)[0]
            : undefined
          : selectedCalendar === 'new'
            ? {
                id: undefined,
                name: globalText('myCalendar'),
                description: '',
                color: '#123abc',
              }
            : calendars?.[selectedCalendar ?? -1],
      [calendars, selectedCalendar],
    ),
  );
  const loading = React.useContext(LoadingContext);

  const [stats] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<IR<number>>('/api/stats/global', {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [],
    ),
    false,
  );

  return (
    <Layout title={undefined}>
      <Container.Quartered>
        <header className="contents">
          <h1 className="flex items-center text-2xl">{globalText('title')}</h1>
          <span />
        </header>
        <main className="contents">
          {Array.isArray(calendars) && (
            <>
              <aside className="flex flex-col gap-4">
                <Ul>
                  {calendars.map((calendar, index) => (
                    <li key={index}>
                      <Link.Default
                        aria-pressed={index === selectedCalendar}
                        href={`/settings/calendars/${index}`}
                      >
                        <span style={{ color: calendar.color }}>
                          {icons.chevronRight}
                        </span>
                        {calendar.name}
                      </Link.Default>
                    </li>
                  ))}
                  <li>
                    <Link.LikeFancyButton
                      className={className.greenButton}
                      href="/settings/calendars/new"
                    >
                      {globalText('add')}
                    </Link.LikeFancyButton>
                  </li>
                </Ul>
              </aside>
              {typeof calendar === 'object' && (
                <section className="flex flex-col gap-4">
                  <Form
                    onSubmit={(): void =>
                      loading(
                        (typeof calendar.id === 'number'
                          ? ping(`/api/table/calendar/${calendar.id}`, {
                              method: 'PUT',
                              body: calendar,
                            })
                          : ajax<Calendar>(
                              '/api/table/calendar',
                              {
                                method: 'POST',
                                headers: { Accept: 'application/json' },
                                body: calendar,
                              },
                              { expectedResponseCodes: [Http.CREATED] },
                            )
                        ).then(async () => router.push('/')),
                      )
                    }
                  >
                    <CalendarView
                      calendar={calendar}
                      onChange={setCalendar}
                      occurrenceCount={
                        typeof stats === 'object'
                          ? stats?.[calendar?.id ?? '']
                          : globalText('loading')
                      }
                    />
                    <div className="flex gap-2">
                      <Link.LikeFancyButton
                        className={className.grayButton}
                        href="/"
                      >
                        {globalText('cancel')}
                      </Link.LikeFancyButton>
                      <Submit.Green>{globalText('save')}</Submit.Green>
                    </div>
                  </Form>
                </section>
              )}
            </>
          )}
        </main>
      </Container.Quartered>
    </Layout>
  );
}
