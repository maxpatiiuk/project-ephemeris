import Head from 'next/head';
import React from 'react';

import { robots, themeColor } from '../const/siteConfig';
import { twitter } from '../const/siteConfig';
import siteInfo from '../const/siteInfo';
import type {
  AvailableLanguages,
  LanguageStringsStructure,
} from '../lib/languages';
import LanguageContext from './LanguageContext';

function extractTitle(
  language: AvailableLanguages['type'],
  title:
    | string
    | LanguageStringsStructure<{
        title: string;
      }>
    | ((string: AvailableLanguages['type']) => string)
): string {
  if (title === '') return siteInfo[language].title;

  const titleString =
    typeof title === 'object'
      ? title[language].title
      : typeof title === 'function'
      ? title(language)
      : title;

  return titleString.endsWith(' ')
    ? `${titleString}- ${siteInfo[language].title}`
    : titleString;
}

function Layout({
  title = '',
  children,
  privatePage = false,
  manifest = '/site.webmanifest',
  icon,
  props,
  useDefaultDescription = true,
}: {
  readonly title?:
    | string
    | LanguageStringsStructure<{
        title: string;
      }>
    | ((string: AvailableLanguages['type']) => string);
  readonly useDefaultDescription?: boolean;
  readonly children: (language: AvailableLanguages['type']) => React.ReactNode;
  readonly privatePage?: boolean;
  readonly manifest?: string;
  readonly icon?: string;
  readonly props?: JSX.Element;
}): JSX.Element {
  return (
    <LanguageContext.Consumer>
      {(language): JSX.Element => (
        <>
          <Head>
            <title>{extractTitle(language, title)}</title>
            <meta property="og:title" content={extractTitle(language, title)} />
            <link rel="icon" href={icon ?? '/favicon.ico"'} />
            <meta
              name="robots"
              content={privatePage ? 'noindex,nofollow' : robots}
            />
            {useDefaultDescription && (
              <>
                <meta
                  name="description"
                  content={siteInfo[language].description}
                />
                <meta
                  property="og:description"
                  content={siteInfo[language].description}
                />
              </>
            )}
            <meta name="keywords" content={siteInfo[language].keywords} />
            <meta name="twitter:site" content={twitter} />
            <meta name="twitter:card" content="summary_large_image" />
            {typeof icon === 'undefined' && (
              <>
                <link
                  rel="apple-touch-icon"
                  sizes="180x180"
                  href="/icons/apple-touch-icon.png"
                />
                <link
                  rel="icon"
                  type="image/png"
                  sizes="32x32"
                  href="/icons/favicon-32x32.png"
                />
                <link
                  rel="icon"
                  type="image/png"
                  sizes="16x16"
                  href="/icons/favicon-16x16.png"
                />
              </>
            )}
            <link rel="manifest" href={manifest} />
            <link
              rel="mask-icon"
              href="/icons/safari-pinned-tab.svg"
              color={themeColor}
            />
            <meta name="msapplication-TileColor" content={themeColor} />
            <meta name="theme-color" content={themeColor} />
            {props}
          </Head>
          <div id="root">{children(language)}</div>
        </>
      )}
    </LanguageContext.Consumer>
  );
}

export default Layout;
