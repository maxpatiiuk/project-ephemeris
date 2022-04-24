/**
 * Typings for the cache buckets
 *
 * @module
 */

import type { RA } from './types';

/** The types of cached values are defined here */
export type CacheDefinitions = {
  readonly main: {
    readonly enabledCalendars: RA<number>;
  };
};
