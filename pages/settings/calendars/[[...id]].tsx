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
import {
  useAsyncState,
  useLiveState,
  useOriginalValue,
} from '../../../components/Hooks';
import { icons } from '../../../components/Icons';
import Layout from '../../../components/Layout';
import { ajax, Http, ping } from '../../../lib/ajax';
import type { Calendar, New } from '../../../lib/datamodel';
import { f } from '../../../lib/functools';
import type { RA } from '../../../lib/types';
import { defined } from '../../../lib/types';
import { globalText } from '../../../localization/global';

export default function Calendars(): JSX.Element {
  const [calendars] = useAsyncState<RA<New<Calendar>>>(
    React.useCallback(
      async () =>
        ajax<RA<Calendar>>('/api/table/calendar', {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      []
    ),
    true
  );
  const originalCalendars = useOriginalValue(calendars);

  const router = useRouter();
  const selectedCalendar =
    f.parseInt((router.query.id as RA<string> | undefined)?.[0] ?? '') ??
    undefined;
  const [calendar, setCalendar] = useLiveState(
    React.useCallback(
      () =>
        calendars?.[selectedCalendar ?? -1] ?? {
          id: undefined,
          name: globalText('myCalendar'),
          description: '',
          color: '#ffffff',
        },
      [calendars, selectedCalendar]
    )
  );
  const loading = React.useContext(LoadingContext);

  return (
    <Layout title={undefined}>
      <Container.Quartered>
        <header className="contents">
          <h1 className="flex items-center text-2xl">{globalText('title')}</h1>
          <Link.Default href="/">{globalText('goBack')}</Link.Default>
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
                        Promise.all(
                          calendars.map((calendar, index) =>
                            typeof calendar.id === 'number'
                              ? JSON.stringify(calendar) ===
                                JSON.stringify(
                                  defined(originalCalendars)[index]
                                )
                                ? undefined
                                : ping(
                                    `/api/table/calendar/${calendar.id}`,
                                    {
                                      method: 'PUT',
                                      body: calendar,
                                    },
                                    { expectedResponseCodes: [Http.NO_CONTENT] }
                                  )
                              : ping(
                                  '/api/table/calendar',
                                  {
                                    method: 'POST',
                                    body: calendar,
                                  },
                                  { expectedResponseCodes: [Http.CREATED] }
                                )
                          )
                        ).then(async () => router.push('/'))
                      )
                    }
                  >
                    <CalendarView calendar={calendar} onChange={setCalendar} />
                    <div className="flex gap-2">
                      <Link.LikeFancyButton
                        className={className.redButton}
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
