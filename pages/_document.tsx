import Document, { Head, Html, Main } from 'next/document';
import React from 'react';

export default class MyDocument extends Document {
  public render(): JSX.Element {
    return (
      <Html>
        <Head />
        <body>
          <Main />
        </body>
      </Html>
    );
  }
}
