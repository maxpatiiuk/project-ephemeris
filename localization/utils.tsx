/**
 * Localization utilities and localization string resolver
 *
 * @module
 */

import { camelToHuman } from '../lib/helpers';
import type { IR, RA, RR } from '../lib/types';

// Only en-us is available at this time
export const languages = ['en-us'] as const;

export type Language = (typeof languages)[number];
export const DEFAULT_LANGUAGE = 'en-us';
// Appropriate language is selected by Next.js. Read it from html[lang]
export const LANGUAGE: Language =
  (typeof document === 'object' &&
  languages.includes(document.documentElement.lang.toLowerCase() as Language)
    ? (document.documentElement.lang.toLowerCase() as Language)
    : undefined) ?? DEFAULT_LANGUAGE;

type Line = string | JSX.Element;
export type Value =
  | RR<Language, Line>
  | RR<Language, (...args: RA<never>) => Line>;
type GetValueType<VALUE extends Value> = VALUE extends RR<
  Language,
  infer ValueType
>
  ? ValueType
  : never;
export type Dictionary = IR<Value>;

function assertExhaustive(key: string): never {
  /*
   * If a .ts or .tsx file tries to access a non-existing key, a
   * build-time error would be thrown.
   * For .js and .jsx files, some errors may be shown in the editor depending on
   * the IDE. The rest would be thrown at runtime.
   * For templates (.html), no errors would be shown, and thus this exception
   * may be thrown at runtime.
   * To prevent runtime errors, a ../tests/testlocalization.ts script has been
   * added. It checks both for nonexistent key usages, invalid usages and unused
   * keys. It also warns about duplicate key values.
   */
  const errorMessage = `
    Trying to access the value for a non-existent localization key "${key}"`;
  if (process.env.NODE_ENV === 'production') {
    console.error(errorMessage);
    // Convert a camel case key to a human readable form
    const value: any = camelToHuman(key);

    /*
     * Since the language key normally resolves to either function or string,
     * we need to create a "Frankenstein" function that also behaves like a
     * string
     */
    const defaultValue: any = (): string => value;
    Object.getOwnPropertyNames(Object.getPrototypeOf(value)).forEach(
      (proto) => {
        defaultValue[proto] =
          typeof value[proto] === 'function'
            ? value[proto].bind(value)
            : value[proto];
      },
    );
    return defaultValue as never;
  } else throw new Error(errorMessage);
}

export function createDictionary<DICT extends Dictionary>(dictionary: DICT) {
  const resolver = <KEY extends string & keyof typeof dictionary>(
    key: KEY,
  ): GetValueType<(typeof dictionary)[typeof key]> =>
    key in dictionary
      ? (dictionary[key][LANGUAGE] as GetValueType<
          (typeof dictionary)[typeof key]
        >) ?? assertExhaustive(key)
      : assertExhaustive(key);
  resolver.dictionary = dictionary;
  return resolver;
}

/**
 * Make whitespace insensitive string suitable to go into a
 * whitespace sensitive place (e.g [title] attribute)
 *
 * New lines are ignored. To provide an explicit new line, use <br>
 */
export const whitespaceSensitive = (string: string): string =>
  string
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/<br>\s?/, '\n');
