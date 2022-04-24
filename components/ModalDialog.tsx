// This must be accompanied by a label since loading bar is hidden from screen readers
import React from 'react';
import Draggable from 'react-draggable';
import type { Props } from 'react-modal';
import Modal from 'react-modal';

import { globalText } from '../localization/global';
import type { RawTagProps } from './Basic';
import { Button, className, DialogContext, transitionDuration } from './Basic';
import { useId } from './Hooks';

export const loadingBar = (
  <div
    aria-hidden="true"
    className={`animate-bounce h-7 bg-gradient-to-r from-orange-400
      to-amber-200 mt-5 rounded`}
  />
);

/**
 * Modal dialog with a loading bar
 * @module
 */
export function LoadingScreen({
  isLoading = true,
}: {
  readonly isLoading?: boolean;
}): JSX.Element {
  return (
    <Dialog
      isOpen={isLoading}
      header={globalText('loading')}
      className={{ container: dialogClassNames.narrowContainer }}
      buttons={undefined}
      onClose={undefined}
    >
      {loadingBar}
    </Dialog>
  );
}

const commonContainer = `rounded resize overflow-y-hidden max-w-[90%]
  shadow-lg shadow-gray-500`;
export const dialogClassNames = {
  freeContainer: `${commonContainer} max-h-[90%]`,
  narrowContainer: `${commonContainer} max-h-[50%] min-w-[min(20rem,90%)]
    lg:max-w-[50%]`,
  normalContainer: `${commonContainer} max-h-[90%] min-w-[min(30rem,90%)]`,
  wideContainer: `${commonContainer} max-h-[90%] min-w-[min(40rem,90%)]`,
  flexContent: 'flex flex-col gap-y-2',
} as const;

/*
 * Starting at 180 puts dialogs over Handsontable column headers (which have
 * z-index of 180)
 */
const initialIndex = 180;
const topIndex = 10_000;
const dialogIndexes: Set<number> = new Set();
const getNextIndex = (): number =>
  dialogIndexes.size === 0 ? initialIndex : Math.max(...dialogIndexes) + 1;

export function Dialog({
  /*
   * Using isOpen prop instead of conditional rendering is optional, but it
   * allows for smooth dialog close animation
   */
  isOpen = true,
  header,
  headerButtons,
  buttons,
  children,
  /*
   * Non-modal dialogs are discouraged due to accessibility concerns and
   * possible state conflicts arising from the user interacting with different
   * parts of the app at the same time
   */
  modal = true,
  onClose: handleClose,
  className: {
    // Dialog's content is a flexbox
    content: contentClassName = dialogClassNames.flexContent,
    // Dialog has optimal width
    container: containerClassName = dialogClassNames.normalContainer,
    // Buttons are right-aligned by default
    buttonContainer: buttonContainerClassName = 'justify-end',
    header: headerClassName = `${className.h2} text-xl`,
  } = {},
  /* Force dialog to stay on top of all others. Useful for exception messages */
  forceToTop = false,
  contentRef,
}: {
  readonly isOpen?: boolean;
  readonly header: React.ReactNode;
  readonly headerButtons?: React.ReactNode;
  // Have to explicitly pass undefined if you don't want buttons
  readonly buttons: undefined | string | JSX.Element;
  readonly children: React.ReactNode;
  readonly modal?: boolean;
  /*
   * Have to explicitly pass undefined if dialog should not be closable
   *
   * This gets called only when dialog is closed by the user.
   * If dialog is removed from the element tree programmatically, callback is
   * not called
   */
  readonly onClose: (() => void) | undefined;
  readonly className?: {
    readonly content?: string;
    readonly container?: string;
    readonly buttonContainer?: string;
    readonly header?: string;
  };
  readonly forceToTop?: boolean;
  readonly contentRef?: RawTagProps<'div'>['ref'];
}): JSX.Element {
  const id = useId('modal');

  /*
   * Don't set index on first render, because that may lead multiple dialogs
   * to have the same index, since render of all children is done before any
   * useEffect can update max z-index)
   */
  const [zIndex, setZindex] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    if (forceToTop) {
      setZindex(topIndex);
      return undefined;
    }
    const zIndex = getNextIndex();
    setZindex(zIndex);
    dialogIndexes.add(zIndex);
    return (): void => setZindex(undefined);
  }, [isOpen, forceToTop]);

  React.useEffect(() => {
    if (forceToTop || modal || !isOpen || typeof zIndex === 'undefined')
      return undefined;

    dialogIndexes.add(zIndex);
    return (): void => void dialogIndexes.delete(zIndex);
  }, [forceToTop, modal, isOpen, zIndex]);

  // Facilitate moving non-modal dialog to top on click
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (
      forceToTop ||
      modal ||
      !isOpen ||
      typeof zIndex === 'undefined' ||
      container === null
    )
      return undefined;
    const handleClick = (): void =>
      // Check if dialog is already at the very top
      Math.max(...dialogIndexes) === zIndex
        ? undefined
        : setZindex(getNextIndex);

    container.addEventListener('click', handleClick);
    return (): void => container?.removeEventListener('click', handleClick);
  }, [forceToTop, modal, isOpen, zIndex, container]);

  const draggableContainer: Props['contentElement'] = React.useCallback(
    (props, children) => (
      <Draggable
        // Don't allow moving the dialog past the window bounds
        bounds="parent"
        // Allow moving the dialog when hovering over the header line
        handle={`#${id('handle')}`}
        // Don't allow moving when in full-screen
        cancel={`#${id('full-screen')}`}
        // Don't need any extra classNames
        defaultClassName=""
        defaultClassNameDragging=""
        defaultClassNameDragged=""
        nodeRef={containerRef}
      >
        <div {...props}>{children}</div>
      </Draggable>
    ),
    [id]
  );

  return (
    <Modal
      isOpen={isOpen}
      closeTimeoutMS={transitionDuration === 0 ? undefined : transitionDuration}
      overlayClassName={{
        base: `w-screen h-screen absolute inset-0 flex items-center
          justify-center ${
            modal
              ? 'bg-gray-500/70 dark:bg-neutral-900/70'
              : 'pointer-events-none'
          }`,
        afterOpen: `opacity-1`,
        beforeClose: 'opacity-0',
      }}
      style={{ overlay: { zIndex } }}
      portalClassName=""
      className={`bg-gradient-to-bl from-gray-200 dark:from-neutral-800
        via-white dark:via-neutral-900 to-white dark:to-neutral-900
        outline-none flex flex-col p-4 gap-y-2 ${containerClassName}
        dark:text-neutral-200 dark:border dark:border-neutral-700
        text-neutral-900
        ${modal ? '' : 'pointer-events-auto border border-gray-500'}`}
      shouldCloseOnEsc={modal && typeof handleClose === 'function'}
      shouldCloseOnOverlayClick={modal && typeof handleClose === 'function'}
      aria={{
        labelledby: id('header'),
        describedby: id('content'),
      }}
      onRequestClose={handleClose}
      bodyOpenClassName={null}
      htmlOpenClassName={null}
      ariaHideApp={modal}
      contentRef={(container): void => {
        // Save to state so that React.useEffect hooks are reRun
        setContainer(container ?? null);
        // Save to React.useRef so that React Draggable can have immediate access
        containerRef.current = container ?? null;
      }}
      contentElement={draggableContainer}
    >
      {/* "p-4 -m-4" increases the handle size for easier dragging */}
      <span
        className={`flex flex-wrap gap-4 p-4 -m-4 cursor-move`}
        id={id('handle')}
      >
        <div className="flex items-center gap-2">
          <h2 className={headerClassName} id={id('header')}>
            {header}
          </h2>
        </div>
        {headerButtons}
      </span>
      {/*
       * "px-1 -mx-1" ensures that focus outline for checkboxes
       * and other inputs is not cut-off
       */}
      <div
        className={`px-1 py-4 -mx-1 overflow-y-auto flex-1 text-gray-700
          dark:text-neutral-350 ${contentClassName}`}
        ref={contentRef}
        id={id('content')}
      >
        {children}
      </div>
      {typeof buttons !== 'undefined' && (
        <div className={`gap-x-2 flex ${buttonContainerClassName}`}>
          <DialogContext.Provider value={handleClose}>
            {typeof buttons === 'string' ? (
              // If button was passed directly as text, render it as Blue.Button
              <Button.DialogClose component={Button.Blue}>
                {buttons}
              </Button.DialogClose>
            ) : (
              buttons
            )}
          </DialogContext.Provider>
        </div>
      )}
    </Modal>
  );
}
