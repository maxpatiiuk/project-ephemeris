import type { IR } from './types';

const toAbsoluteUrl = (url: string): string =>
  url.startsWith('/') ? `${window.location.origin}${url}` : url;

/** Convert type's keys to lowercase */
export type KeysToLowerCase<DICTIONARY extends IR<unknown>> = {
  [KEY in keyof DICTIONARY as Lowercase<
    KEY & string
  >]: DICTIONARY[KEY] extends IR<unknown>
    ? KeysToLowerCase<DICTIONARY[KEY]>
    : DICTIONARY[KEY];
};

/** Recursively convert keys on an object to lowercase */
export const keysToLowerCase = <OBJECT extends IR<unknown>>(
  resource: OBJECT
): KeysToLowerCase<OBJECT> =>
  Object.fromEntries(
    Object.entries(resource).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value)
        ? value.map(keysToLowerCase)
        : typeof value === 'object' && value !== null
        ? keysToLowerCase(value as IR<unknown>)
        : value,
    ])
  ) as unknown as KeysToLowerCase<OBJECT>;

export function formatUrl(url: string, parameters: IR<string>): string {
  const urlObject = new URL(toAbsoluteUrl(url));
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...keysToLowerCase(parameters),
  }).toString();
  return urlObject.toString();
}

export const parseUrl = (url: string = window.location.href): IR<string> =>
  Object.fromEntries(new URL(toAbsoluteUrl(url)).searchParams);
