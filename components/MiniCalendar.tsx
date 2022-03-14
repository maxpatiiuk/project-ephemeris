export function MiniCalendar({
  currentDate,
  onDateSelect,
}: {
  readonly currentDate: Date;
  readonly onDateSelect: (newDate: Date) => void;
}): JSX.Element {}
