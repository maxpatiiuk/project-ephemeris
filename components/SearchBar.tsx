import { useRouter } from 'next/router';
import React from 'react';

import { ajax } from '../lib/ajax';
import type { EventOccurrence } from '../lib/dataModel';
import { f } from '../lib/functools';
import type { RA } from '../lib/types';
import { serializeDate } from '../lib/utils';
import { globalText } from '../localization/global';
import { Autocomplete } from './Autocomplete';
import { Input } from './Basic';
import { useClientSide } from './Hooks';
import { iconClassName } from './Icons';
import { getRelativeDate } from './Internationalization';

export function SearchBar({
  currentDate,
}: {
  readonly currentDate: Date;
}): JSX.Element | null {
  const [value, setValue] = React.useState<string>('');
  const router = useRouter();
  const isClientSide = useClientSide();
  return isClientSide ? (
    <Autocomplete<EventOccurrence>
      source={async (value) =>
        ajax<RA<EventOccurrence & { readonly recurring: boolean }>>(
          `/api/search/${value}/arround/${serializeDate(currentDate)}`,
          {
            method: 'POST',
            headers: { Accept: 'application/json' },
          }
        ).then(({ data }) =>
          data.map(({ recurring, ...occurrence }) => ({
            label: `${occurrence.name}${
              recurring ? ` (${globalText('recurring')})` : ''
            }`,
            subLabel: (
              <>
                <time dateTime={occurrence.startDateTime.toString()}>
                  {f.var(new Date(occurrence.startDateTime), (startDate) =>
                    getRelativeDate(startDate)
                  )}
                </time>
                <div
                  className={`${iconClassName} rounded-full`}
                  style={{ backgroundColor: occurrence.color }}
                />
              </>
            ),
            data: occurrence,
          }))
        )
      }
      onNewValue={(): void =>
        void router.push(
          `/view/${router.query.view as string}/date/${serializeDate(
            currentDate
          )}/event/add`
        )
      }
      onChange={({ data }): void =>
        void router.push(
          `/view/${router.query.view as string}/date/${serializeDate(
            new Date(data.startDateTime)
          )}/event/${data.id}`
        )
      }
      onCleared={(): void => setValue('')}
      filterItems={false}
      aria-label={globalText('search')}
      value={value}
    >
      {(props): JSX.Element => (
        <Input.Generic
          className="w-full max-w-[30rem]"
          placeholder={globalText('search')}
          {...props}
        />
      )}
    </Autocomplete>
  ) : null;
}
