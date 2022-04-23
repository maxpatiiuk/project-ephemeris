/*
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';

import { breakpoint } from '../lib/assert';
import { globalText } from '../localization/global';
import { Button } from './Basic';
import { summonErrorPage } from './Contexts';
import { Dialog } from './ModalDialog';

type ErrorBoundaryState =
  | {
      readonly hasError: false;
    }
  | {
      readonly hasError: true;
      readonly error: { toString: () => string };
      readonly errorInfo: { componentStack: string };
    };

function ErrorDialog({
  title = globalText('errorBoundaryDialogTitle'),
  header = globalText('errorBoundaryDialogHeader'),
  children,
  // Error dialog is only closable in Development
  onClose: handleClose,
}: {
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly header?: string;
  readonly onClose?: () => void;
}): JSX.Element {
  return (
    <Dialog
      title={title}
      header={header}
      buttons={
        <>
          <Button.Red onClick={(): void => window.location.assign('/')}>
            {globalText('close')}
          </Button.Red>
          {process.env.NODE_ENV !== 'production' &&
            typeof handleClose === 'function' && (
              <Button.Blue onClick={handleClose}>
                [development] dismiss
              </Button.Blue>
            )}
        </>
      }
      forceToTop={true}
      onClose={undefined}
    >
      <p>{globalText('errorBoundaryDialogMessage')}</p>
      <details className="flex-1 whitespace-pre-wrap">
        <summary>{globalText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function crash(error: Error): void {
  if (
    error instanceof Error &&
    Object.getOwnPropertyDescriptor(error, 'handledBy')?.value ===
      handleAjaxError
  )
    // It is a network error, and it has already been handled
    return;
  const [errorObject, errorMessage] = formatError(error);
  console.error(errorMessage);
  breakpoint();
  summonErrorPage(
    <ErrorDialog onClose={() => summonErrorPage(undefined)}>
      {errorObject}
    </ErrorDialog>
  );
}

export class ErrorBoundary extends React.Component<
  {
    readonly children: JSX.Element | null;
    /*
     * Can wrap a component in an <ErrorBoundary> with silentErrors
     * to silence all errors from it (on error, the component is quietly
     * deRendered), if in production
     * Useful for ensuring non-critical and experimental components don't
     * crash the whole application
     */
    readonly silentErrors?: boolean;
  },
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public componentDidCatch(
    error: { readonly toString: () => string },
    errorInfo: { readonly componentStack: string }
  ): void {
    console.error(error.toString());
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  public render(): JSX.Element | null {
    return this.state.hasError ? (
      this.props.silentErrors === true ||
      process.env.NODE_ENV === 'development' ? null : (
        <ErrorDialog>
          {this.state.error?.toString()}
          <br />
          {this.state.errorInfo.componentStack}
        </ErrorDialog>
      )
    ) : (
      this.props.children
    );
  }
}

function formatError(
  error: unknown,
  url?: string
): Readonly<[errorObject: JSX.Element, errorMessage: string]> {
  const errorObject: React.ReactNode[] = [
    typeof url === 'string' && (
      <p>
        Error occurred fetching from <code>{url}</code>
      </p>
    ),
  ];
  const errorMessage: string[] =
    typeof url === 'string' ? [`Error occurred fetching from ${url}`] : [];

  if (typeof error === 'object' && error !== null) {
    if (error instanceof Error) {
      errorObject.push(
        <>
          <p>Stack:</p>
          <pre>{error.stack}</pre>
        </>
      );
      errorMessage.push(`Error: ${error.message}`);
      console.error(error);
    } else if ('statusText' in error && 'responseText' in error) {
      const { statusText, responseText } = error as {
        readonly statusText: string;
        readonly responseText: string;
      };
      errorObject.push(
        <>
          <p>{statusText}</p>
          {formatErrorResponse(responseText)}
        </>
      );
      errorMessage.push(statusText);
    } else errorObject.push(<p>{error.toString()}</p>);
  }

  return [
    <div className="gap-y-2 flex flex-col h-full">{errorObject}</div>,
    errorMessage.join('\n'),
  ] as const;
}

export function handleAjaxError(
  error: unknown,
  url: string,
  strict: boolean
): never {
  const [errorObject, errorMessage] = formatError(error, url);
  if (strict)
    summonErrorPage(
      <ErrorDialog onClose={(): void => summonErrorPage(undefined)}>
        {errorObject}
      </ErrorDialog>
    );
  const newError = new Error(errorMessage);
  Object.defineProperty(newError, 'handledBy', {
    value: handleAjaxError,
  });
  throw newError;
}

function formatErrorResponse(error: string): JSX.Element {
  try {
    const json = JSON.parse(error);
    return <pre>{JSON.stringify(json, null, 2)}</pre>;
  } catch {
    // Failed parsing error message as JSON
  }
  try {
    if (typeof document === 'object') {
      const htmlElement = document.createElement('html');
      htmlElement.innerHTML = error;
      htmlElement.remove();
    }
    return <ErrorIframe>{error}</ErrorIframe>;
  } catch {
    // Failed parsing error message as HTML
  }
  // Output raw error message
  return <pre>{error}</pre>;
}

function ErrorIframe({ children: error }: { children: string }): JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  React.useEffect(() => {
    if (iframeRef.current === null) return;
    const iframeDocument =
      iframeRef.current.contentDocument ??
      iframeRef.current.contentWindow?.document;
    if (typeof iframeDocument === 'undefined') return;
    iframeDocument.body.innerHTML = error;
  }, [error]);

  return (
    <iframe
      title={globalText('errorBoundaryDialogTitle')}
      className="h-full"
      ref={iframeRef}
    />
  );
}
