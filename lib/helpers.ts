/**
 * Collection of various helper methods
 *
 * @module
 */

import { f } from './functools';
import type { IR, RA } from './types';

export const capitalize = <T extends string>(string: T): Capitalize<T> =>
  (string.charAt(0).toUpperCase() + string.slice(1)) as Capitalize<T>;

export const camelToHuman = (value: string): string =>
  capitalize(value.replace(/([a-z])([A-Z])/g, '$1 $2')).replace(/Dna\b/, 'DNA');

/** Generate a sort function for Array.prototype.sort */
export const sortFunction =
  <T, V extends boolean | number | string | null>(
    mapper: (value: T) => V,
    reverse = false,
  ): ((left: T, right: T) => -1 | 0 | 1) =>
  (left: T, right: T): -1 | 0 | 1 => {
    const [leftValue, rightValue] = reverse
      ? [mapper(right), mapper(left)]
      : [mapper(left), mapper(right)];
    if (leftValue === rightValue) return 0;
    return typeof leftValue === 'string' && typeof rightValue === 'string'
      ? (leftValue.localeCompare(rightValue) as -1 | 0 | 1)
      : (leftValue ?? '') > (rightValue ?? '')
        ? 1
        : -1;
  };

/** Split array in half according to a discriminator function */
export const split = <ITEM>(
  array: RA<ITEM>,
  // If returns true, item would go to the right array
  discriminator: (item: ITEM, index: number, array: RA<ITEM>) => boolean,
): Readonly<[left: RA<ITEM>, right: RA<ITEM>]> =>
  array
    .map((item, index) => [item, discriminator(item, index, array)] as const)
    .reduce<Readonly<[left: RA<ITEM>, right: RA<ITEM>]>>(
      ([left, right], [item, isRight]) => [
        [...left, ...(isRight ? [] : [item])],
        [...right, ...(isRight ? [item] : [])],
      ],
      [[], []],
    );

export const omit = <
  DICTIONARY extends IR<unknown>,
  OMIT extends keyof DICTIONARY,
>(
  object: DICTIONARY,
  toOmit: RA<OMIT>,
): {
  readonly [KEY in keyof DICTIONARY as KEY extends OMIT
    ? never
    : KEY]: DICTIONARY[KEY];
} =>
  // @ts-expect-error
  Object.fromEntries(
    Object.entries(object).filter(([key]) => !f.includes(toOmit, key)),
  );

/** Create a new array with a given item replaced */
export const replaceItem = <T>(array: RA<T>, index: number, item: T): RA<T> => [
  ...array.slice(0, index),
  item,
  ...array.slice(index + 1),
];

export const toggleItem = <T>(array: RA<T>, toggle: T): RA<T> =>
  array.includes(toggle)
    ? array.filter((item) => item !== toggle)
    : [...array, toggle];

/**
 * Creates a new object with a given key replaced.
 * Unlike object decomposition, this would preserve the order of keys
 */
export const replaceKey = <T extends IR<unknown>>(
  object: T,
  targetKey: keyof T,
  newValue: T[keyof T],
): T =>
  object[targetKey] === newValue
    ? object
    : (Object.fromEntries(
        Object.entries(object).map(([key, value]) => [
          key,
          /*
           * Convert targetKey to string because Object.entries convers all keys
           * to a string
           */
          key === targetKey.toString() ? newValue : value,
        ]),
      ) as T);
