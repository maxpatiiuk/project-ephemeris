import '../styles/main.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';

import { Contexts } from '../components/Contexts';
import { ErrorBoundary } from '../components/ErrorBoundary';

function App({ Component, pageProps }: AppProps): JSX.Element {
  React.useEffect(() => {
    if ('serviceWorker' in navigator)
      window.addEventListener(
        'load',
        () => void navigator.serviceWorker.register('/sw.js')
      );
  }, []);

  return (
    <ErrorBoundary>
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
        </Head>
        <Contexts>
          <Component {...pageProps} />
          <div id="portal-root" />
        </Contexts>
      </>
    </ErrorBoundary>
  );
}

const app = App;
export default app;
