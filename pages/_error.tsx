import type { NextPageContext } from 'next';
import React from 'react';

import ErrorPage from '../components/ErrorPage';

function Error({ statusCode }: { statusCode: number }): JSX.Element {
  return <ErrorPage errorCode={statusCode} />;
}

Error.getInitialProps = ({ res, err }: NextPageContext) => ({
  statusCode: res ? res.statusCode : err ? err.statusCode : 404,
});

export default Error;
