import React from 'react';

import { Button, Select } from '../components/Basic';
import { dateParts } from '../components/Internationalization';
import Layout from '../components/Layout';
import { MainView } from '../components/MainView';
import { MiniCalendar } from '../components/MiniCalendar';
import { globalText } from '../localization/global';

export type View = 'day' | 'week' | 'month' | 'year';

export default function Index(): JSX.Element {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<View>('week');

  return (
    <Layout title={undefined}>
      <div
        className={`min-h-screen flex flex-col gap-2 bg-black text-white
           grid grid-cols-[256px_1fr] grid-rows-[min-content_1fr] p-4`}
      >
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
          <aside>
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
              mode="aside"
            />
          </aside>
          <MainView
            type={view}
            date={currentDate}
            onViewChange={setView}
            onDateSelect={setCurrentDate}
          />
        </main>
      </div>
    </Layout>
  );
}
