import Head from 'next/head';
import React from 'react';

import { robots, themeColor } from '../const/siteConfig';
import { twitter } from '../const/siteConfig';
import { globalText } from '../localization/global';

const extractTitle = (title: string): string =>
  title === ''
    ? globalText('title')
    : title.endsWith(' ')
    ? `${title}- ${globalText('title')}`
    : title;

function Layout({
  title = '',
  children,
  privatePage = false,
  manifest = '/site.webmanifest',
  icon,
  props,
  useDefaultDescription = true,
}: {
  readonly title: string | undefined;
  readonly useDefaultDescription?: boolean;
  readonly children: JSX.Element;
  readonly privatePage?: boolean;
  readonly manifest?: string;
  readonly icon?: string;
  readonly props?: JSX.Element;
}): JSX.Element {
  return (
    <>
      <Head>
        <title>{extractTitle(title)}</title>
        <meta property="og:title" content={extractTitle(title)} />
        <link rel="icon" href={icon ?? '/favicon.ico"'} />
        <meta
          name="robots"
          content={privatePage ? 'noindex,nofollow' : robots}
        />
        {useDefaultDescription && (
          <>
            <meta name="description" content={globalText('description')} />
            <meta
              property="og:description"
              content={globalText('description')}
            />
          </>
        )}
        <meta name="keywords" content={globalText('keywords')} />
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
      <div id="root">{children}</div>
    </>
  );
}

export default Layout;
