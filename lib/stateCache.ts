import React from 'react';

import { crash } from '../components/ErrorBoundary';
import type { BucketType } from './cache';
import * as cache from './cache';
import type { CacheDefinitions } from './cacheDefinitions';
import { isFunction } from './types';

type DefaultValue<T> = T | Promise<T> | (() => Promise<T>);

/**
 * Like React.useState, but initial value is read from localStorage
 * and all changes are written back to localStorage
 */
export function useCachedState<
  BUCKET_NAME extends string & keyof CacheDefinitions,
  CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME],
>({
  bucketName,
  cacheName,
  bucketType,
  defaultValue,
  /**
   * A concept borrowed from Vercel's SWR,
   * If there is a cashed state in localStorage, use that, but still fetch
   * the most up to date value and use that once fetched
   */
  staleWhileRefresh,
}: {
  readonly bucketName: BUCKET_NAME;
  readonly cacheName: CACHE_NAME;
  readonly bucketType: BucketType;
  readonly defaultValue?: DefaultValue<
    CacheDefinitions[BUCKET_NAME][CACHE_NAME]
  >;
  readonly staleWhileRefresh: boolean;
}): [
  value: CacheDefinitions[BUCKET_NAME][CACHE_NAME] | undefined,
  setValue: (newValue: CacheDefinitions[BUCKET_NAME][CACHE_NAME]) => void,
] {
  const [state, setState] = React.useState<
    CacheDefinitions[BUCKET_NAME][CACHE_NAME] | undefined
  >(() =>
    cache.get(bucketName, cacheName, {
      defaultSetOptions: {
        bucketType,
      },
    }),
  );

  const setCachedState = React.useCallback(
    (newValue: CacheDefinitions[BUCKET_NAME][CACHE_NAME]) =>
      setState(
        cache.set(bucketName, cacheName, newValue, {
          bucketType,
          overwrite: true,
        }),
      ),
    [bucketName, cacheName, bucketType],
  );

  const isUndefined = state === undefined;
  React.useEffect(() => {
    if (isUndefined || staleWhileRefresh)
      (isFunction(defaultValue)
        ? Promise.resolve(defaultValue())
        : Promise.resolve(defaultValue)
      )
        .then((value) =>
          value === undefined
            ? undefined
            : setCachedState(
                value as CacheDefinitions[BUCKET_NAME][CACHE_NAME],
              ),
        )
        .catch(crash);
  }, [isUndefined, defaultValue, setCachedState, staleWhileRefresh]);

  return [state, setCachedState];
}
