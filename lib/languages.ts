import type { Action } from 'typesafe-reducer';

import type { IR, RA } from './types';

export type AvailableLanguages = Action<'en-US'>;

type LanguageString = string | JSX.Element | number;

export type LanguageStringsStructure<
  DEFINITIONS extends IR<
    LanguageString | ((...args: RA<never>) => LanguageString)
  >
> = {
  readonly [language in AvailableLanguages['type']]: DEFINITIONS;
};
