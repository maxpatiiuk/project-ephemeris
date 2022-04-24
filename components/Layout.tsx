import Head from 'next/head';
import React from 'react';

import { robots, themeColor, twitter } from '../const/siteConfig';
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
  props,
  useDefaultDescription = true,
}: {
  readonly title: string | undefined;
  readonly useDefaultDescription?: boolean;
  readonly children: JSX.Element;
  readonly privatePage?: boolean;
  readonly props?: JSX.Element;
}): JSX.Element {
  return (
    <>
      <Head>
        <title>{extractTitle(title)}</title>
        <meta property="og:title" content={extractTitle(title)} />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="robots"
          content={privatePage ? 'noindex,nofollow' : robots}
        />
        {useDefaultDescription && (
          <>
            <meta name="description" content={globalText('siteDescription')} />
            <meta
              property="og:description"
              content={globalText('siteDescription')}
            />
          </>
        )}
        <meta name="keywords" content={globalText('keywords')} />
        <meta name="twitter:site" content={twitter} />
        <meta name="twitter:card" content="summary_large_image" />
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
