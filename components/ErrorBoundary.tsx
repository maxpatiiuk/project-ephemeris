/*
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 */

import React from 'react';

import { globalText } from '../localization/global';
import { Button } from './Basic';
import { ModalDialog } from './ModalDialog';

type ErrorBoundaryState =
  | {
      hasError: false;
      error: undefined;
      errorInfo: undefined;
    }
  | {
      hasError: true;
      error: { toString: () => string };
      errorInfo: { componentStack: string };
    };

export default class ErrorBoundary extends React.Component<
  { children: JSX.Element },
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  };

  public componentDidCatch(
    error: { readonly toString: () => string },
    errorInfo: { readonly componentStack: string }
  ): void {
    console.error(error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  public render(): JSX.Element {
    return this.state.hasError ? (
      <ModalDialog
        title={globalText('unexpectedError')}
        buttons={
          <>
            <Button.Red onClick={(): void => window.location.reload()}>
              {globalText('reload')}
            </Button.Red>
            <Button.Red onClick={(): void => window.history.back()}>
              {globalText('previousPage')}
            </Button.Red>
          </>
        }
      >
        <p>{globalText('unexpectedErrorHasOccurred')}</p>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          {this.state.error?.toString()}
          <br />
          {this.state.errorInfo?.componentStack}
        </details>
      </ModalDialog>
    ) : (
      this.props.children
    );
  }
}
