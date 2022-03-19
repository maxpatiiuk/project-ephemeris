import type { View } from '../pages';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';

export function MainView({
  type,
  date,
  onDateSelect: handleDateSelect,
  onViewChange: handleViewChange,
}: {
  readonly type: View;
  readonly date: Date;
  readonly onDateSelect: (newDate: Date) => void;
  readonly onViewChange: (newView: View) => void;
}): JSX.Element {
  return type === 'year' ? (
    <YearView
      currentDate={date}
      onDateSelect={(newDate): void => {
        handleDateSelect(newDate);
        handleViewChange('week');
      }}
    />
  ) : type === 'month' ? (
    <MonthView
      currentDate={date}
      onDateSelect={(newDate): void => {
        handleDateSelect(newDate);
        handleViewChange('week');
      }}
    />
  ) : type === 'week' ? (
    <WeekView
      currentDate={date}
      onDateSelect={(newDate): void => {
        handleDateSelect(newDate);
        handleViewChange('day');
      }}
    />
  ) : (
    <DayView currentDate={date} />
  );
}
