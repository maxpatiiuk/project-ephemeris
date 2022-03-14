import { globalText } from '../localization/global';
import { Button } from './Basic';
import { icons } from './Icons';
import { countDaysInMonth, months } from './Internationalization';

const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;

export function MiniCalendar({
  currentDate,
  onDateSelect: handleDateSelect,
}: {
  readonly currentDate: Date;
  readonly onDateSelect: (newDate: Date) => void;
}): JSX.Element {
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = countDaysInMonth(year, month);
  const previousMonth = month === 1 ? MONTHS_IN_YEAR : month - 1;
  const previousMonthYear = month === 1 ? year - 1 : year;
  const daysInPreviousMonth = countDaysInMonth(
    previousMonthYear,
    previousMonth
  );
  const weekDayForFirstDay = new Date(year, month, 1).getDay();
  const weekDayForLastDay = new Date(year, month, daysInMonth).getDay();
  const nextMonth = (month + 1) % MONTHS_IN_YEAR;
  const nextMonthYear = month === MONTHS_IN_YEAR - 1 ? year + 1 : year;
  const className = `flex items-center justify-center rounded-full`;
  return (
    <section>
      <div className="flex gap-2">
        <h2>{`${months[month]} ${year}`}</h2>
        <span className="flex-1 -ml-2" />
        <Button.LikeLink
          onClick={(): void =>
            handleDateSelect(
              new Date(
                previousMonthYear,
                previousMonth,
                Math.min(day, daysInPreviousMonth)
              )
            )
          }
        >
          {icons.chevronLeft}
        </Button.LikeLink>
        <Button.LikeLink
          onClick={(): void =>
            handleDateSelect(
              new Date(
                nextMonthYear,
                nextMonth,
                Math.min(day, daysInPreviousMonth)
              )
            )
          }
        >
          {icons.chevronRight}
        </Button.LikeLink>
      </div>
      <div className="grid grid-cols-7">
        {globalText('daysOfWeek')
          .split('')
          .map((dayOfWeek, index) => (
            <div key={index} className={`${className} text-gray-500`}>
              {dayOfWeek}
            </div>
          ))}
        {Array.from({ length: weekDayForFirstDay - 1 }, (_, index) => (
          <Button.LikeLink
            className={`${className} text-gray-500`}
            key={`previousMonth_${index}`}
            onClick={(): void =>
              handleDateSelect(
                new Date(
                  previousMonthYear,
                  previousMonth,
                  daysInPreviousMonth - weekDayForFirstDay + index + 2
                )
              )
            }
          >
            {daysInPreviousMonth - weekDayForFirstDay + index + 2}
          </Button.LikeLink>
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => (
          <Button.LikeLink
            className={`${className} ${
              index + 1 === day ? 'bg-brand-200' : ''
            }`}
            key={`currentMonth_${index}`}
            onClick={(): void =>
              handleDateSelect(new Date(year, month, index + 1))
            }
          >
            {index + 1}
          </Button.LikeLink>
        ))}
        {Array.from(
          { length: DAYS_IN_WEEK - weekDayForLastDay },
          (_, index) => (
            <Button.LikeLink
              className={`${className} text-gray-500`}
              key={`nextMonth_${index}`}
              onClick={(): void =>
                handleDateSelect(new Date(nextMonthYear, nextMonth, index + 1))
              }
            >
              {index + 1}
            </Button.LikeLink>
          )
        )}
      </div>
    </section>
  );
}
