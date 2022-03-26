import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

import { Contexts } from '../components/Contexts';

export default class MyDocument extends Document {
  public render(): JSX.Element {
    return (
      <Html>
        <Head />
        <body>
          <Contexts>
            <Main />
          </Contexts>
          <NextScript />
        </body>
      </Html>
    );
  }
}
