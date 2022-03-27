import { useRouter } from 'next/router';
import React from 'react';

import {
  Button,
  className,
  Container,
  Form,
  Link,
  Submit,
  Ul,
} from '../../components/Basic';
import { CalendarView } from '../../components/CalendarView';
import { LoadingContext } from '../../components/Contexts';
import { useAsyncState, useOriginalValue } from '../../components/Hooks';
import { icons } from '../../components/Icons';
import Layout from '../../components/Layout';
import { ajax, Http, ping } from '../../lib/ajax';
import type { Calendar, New } from '../../lib/datamodel';
import { replaceItem } from '../../lib/helpers';
import type { RA } from '../../lib/types';
import { defined } from '../../lib/types';
import { globalText } from '../../localization/global';

export default function Calendars(): JSX.Element {
  const [calendars, setCalendars] = useAsyncState<RA<New<Calendar>>>(
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

  const [selectedCalendar, setSelectedCalendar] = React.useState<number>(0);
  const loading = React.useContext(LoadingContext);

  const router = useRouter();

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
                      <Button.LikeLink
                        aria-pressed={index === selectedCalendar}
                        onClick={(): void => setSelectedCalendar(index)}
                      >
                        <span style={{ color: calendar.color }}>
                          {icons.chevronRight}
                        </span>
                        {calendar.name}
                      </Button.LikeLink>
                    </li>
                  ))}
                  <li>
                    <Button.Green
                      onClick={(): void => {
                        setCalendars([
                          ...calendars,
                          {
                            id: undefined,
                            name: globalText('myCalendar'),
                            description: '',
                            color: '#ffffff',
                          },
                        ]);
                        setSelectedCalendar(calendars.length);
                      }}
                    >
                      {globalText('add')}
                    </Button.Green>
                  </li>
                </Ul>
              </aside>
              {typeof calendars[selectedCalendar] === 'object' && (
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
                    <CalendarView
                      calendar={calendars[selectedCalendar]}
                      onChange={(calendar): void =>
                        setCalendars(
                          replaceItem(calendars, selectedCalendar, calendar)
                        )
                      }
                    />
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
