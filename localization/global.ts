/**
 * Localization strings that are shared across components or that are used
 * in the Header or UserTools menu
 *
 * @module
 */

import { strip } from '../lib/localizationHelper';
import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const globalText = createDictionary({
  title: { 'en-us': 'Project Ephemeris' },
  description: {
    'en-us': strip(`Ephemeris is a web-based calendar application`),
  },
  keywords: { 'en-us': strip(`Project Ephemeris, Max Patiiuk`) },
  author: { 'en-us': 'Max Patiiuk' },
  returnToHomePage: { 'en-us': '← Return to homepage' },
  opensInNewTab: { 'en-us': '(opens in new tab)' },
  calendars: { 'en-us': 'Calendars' },
  notFoundPageHeader: { 'en-us': 'Oops! Nothing was found' },
  notFoundPageMessage: {
    'en-us': `The page you are looking for might have been removed,
    had its name changed or is temporarily unavailable.`,
  },
  unexpectedError: { 'en-us': 'Unexpected Error' },
  reload: { 'en-us': 'Reload' },
  previousPage: { 'en-us': 'Previous page' },
  unexpectedErrorHasOccurred: { 'en-us': 'An unexpected error has occurred.' },
  today: { 'en-us': 'Today' },
  week: { 'en-us': 'Week' },
});
