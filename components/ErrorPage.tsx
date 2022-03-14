import Link from 'next/link';
import React from 'react';

import Layout from '../components/Layout';
import type { LanguageStringsStructure } from '../lib/languages';
import { commonStrings } from '../localization/global';
import { Centered } from './UI';

const languageStrings: LanguageStringsStructure<{
  header: string;
  message: string;
}> = {
  'en-US': {
    header: 'Oops! Nothing was found',
    message: `The page you are looking for might have been removed,
    had its name changed or is temporarily unavailable.`,
  },
};

function ErrorPage({ errorCode }: { readonly errorCode: number }): JSX.Element {
  return (
    <Layout title={errorCode.toString()}>
      {(language): JSX.Element => (
        <Centered>
          <div className="text-center">
            <h1 className="text-9xl py-2 text-indigo-300">{errorCode}</h1>
            <h2>{languageStrings[language].header}</h2>
            <p>
              {languageStrings[language].message}
              <Link href="/">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  className={`block pt-10 transition
                text-red-400 hover:text-black`}
                >
                  {commonStrings[language].returnToHomePage}
                </a>
              </Link>
            </p>
          </div>
        </Centered>
      )}
    </Layout>
  );
}

export default ErrorPage;
