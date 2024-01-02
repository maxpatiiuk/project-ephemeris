import Link from 'next/link';
import React from 'react';

import Layout from '../components/Layout';
import { globalText } from '../localization/global';

export function ErrorPage({
  errorCode,
}: {
  readonly errorCode: number;
}): JSX.Element {
  return (
    <Layout title={errorCode.toString()}>
      <div className="flex items-center justify-center w-screen h-screen text-center">
        <div className="text-center">
          <h1 className="text-9xl py-2 text-indigo-300">{errorCode}</h1>
          <h2>{globalText('notFoundPageHeader')}</h2>
          <p>
            {globalText('notFoundPageMessage')}
            <Link
              href="/"
              className={`block pt-10 transition
              text-red-400 hover:text-black`}
            >
              {globalText('returnToHomePage')}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
