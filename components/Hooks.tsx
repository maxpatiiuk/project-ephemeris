import React from 'react';

import { f } from '../lib/functools';
import type { R } from '../lib/types';
import { LoadingContext } from './Contexts';

const idStore: R<number> = {};

/**
 * A hook that returns a unique string ID generator that is unique
 * and unchanging for the lifecycle of a component
 */
export function useId(prefix: string): (suffix: string) => string {
  const id = React.useRef(-1);

  const resolvedPrefix = `${prefix}-`;

  if (!(resolvedPrefix in idStore)) idStore[resolvedPrefix] = 0;

  if (id.current === -1) {
    id.current = idStore[resolvedPrefix];
    idStore[resolvedPrefix] += 1;
  }

  return React.useCallback(
    (suffix = ''): string =>
      `${resolvedPrefix}${id.current}${suffix ? `-${suffix}` : ''}`,
    [resolvedPrefix],
  );
}

/**
 * Like React.useState, but initial value is retrieved asynchronously
 * While value is being retrieved, hook returns undefined, which can be
 * conveniently replaced with a default value when destructuring the array
 *
 * @remarks
 * This hook resets the state value every time the prop changes. Thus,
 * you need to wrap the prop in React.useCallback(). This allows for
 * recalculation of the state when parent component props change.
 *
 * If async action is resolved after component destruction, no update occurs
 * (thus no warning messages are triggered)
 *
 * Rejected promises result in a modal error dialog
 *
 * @example
 * This would fetch data from a url, use defaultValue while fetching,
 * reFetch every time url changes, and allow to manually change state
 * value using setValue:
 * ```js
 * const [value=defaultValue, setValue] = useAsyncState(
 *   React.useCallback(()=>fetch(url), [url]);
 * );
 * ```
 */
export function useAsyncState<T>(
  // Can return backOut to cancel a state update
  callback: () => undefined | T | Promise<T | undefined>,
  // Show the loading screen while the promise is being resolved
  loadingScreen: boolean,
): [
  state: T | undefined,
  setState: React.Dispatch<React.SetStateAction<T | undefined>>,
] {
  const [state, setState] = React.useState<T | undefined>(undefined);
  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    setState(undefined);
    const wrapped = loadingScreen ? loading : f.id;
    const backOut = {};
    void wrapped(
      Promise.resolve(callback()).then((newState) =>
        destructorCalled || newState === backOut
          ? undefined
          : setState(newState),
      ),
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [callback, loading, loadingScreen]);

  return [state, setState];
}

/**
 * A synchronous version of useAsyncState
 *
 * @remarks
 * Like React.useState, but default value must always be a function, and when
 * function changes, default value is recalculated and reapplied.
 *
 * Thus, wrap the callback in React.useCallback with dependency array that
 * would determine when the state is recalculated.
 *
 * @example
 * This will call getDefaultValue to get new default value every time
 * dependency changes
 * ```js
 * const [value, setValue] = useLiveState(
 *   React.useCallback(
 *     getDefaultValue,
 *     [dependency]
 *   )
 * );
 * ```
 */
export function useLiveState<T>(
  callback: () => T,
): [state: T, setState: React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => callback());

  useReadyEffect(React.useCallback(() => setState(callback()), [callback]));

  return [state, setState];
}

export const useBrowserLayoutEffect =
  typeof window === 'undefined' ? () => {} : React.useLayoutEffect;

/**
 * Like React.useState, but updates the state whenever default value changes
 */
export function useTriggerState<T>(
  defaultValue: T,
): [state: T, setState: React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(defaultValue);

  /* Using layout effect rather than useEffect to update the state earlier on */
  useBrowserLayoutEffect(() => {
    setState(defaultValue);
  }, [defaultValue]);

  return [state, setState];
}

/**
 * Like React.useEffect, but does not execute on first render.
 * Passed callback must be wrapped in React.useCallback
 */
export function useReadyEffect(callback: () => void): void {
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else callback();
  }, [callback]);
}

/**
 * Many react states are simple boolean switches
 * This hook gives a convenient way to defined such states
 *
 * @example Usage
 * Without this hook:
 * ```js
 * const [isOpen, setIsOpen] = React.useState(false);
 * ```
 * With this hook:
 * ```
 * const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();
 * ```
 * "handleOpen" is easier to reason about than "setIsOpen(false)"
 *
 * If handleClose or handleToggle actions are not needed, they simply
 * don't have to be destructured.
 *
 * Initial value can be given as a prop. State value is changed to match the
 * prop if prop changes.
 *
 * @example Performance optimization
 * This hook also reduces the render the need for reRenders
 * This calls reRender of Dialog on each parent component render since
 * lamda function is redefined at each render:
 * ```js
 * <Dialog onClose={():void => setIsOpen(false)} ... >...</Dialog>
 * ```
 * This doss not cause needless reRenders and looks cleaner:
 * ```js
 * <Dialog onClose={handleClose} ... >...</Dialog>
 * ```
 */
export function useBooleanState(
  value = false,
): Readonly<
  [state: boolean, enable: () => void, disable: () => void, toggle: () => void]
> {
  const [state, setState] = useTriggerState(value);
  return [
    state,
    React.useCallback(
      function enable() {
        setState(true);
      },
      [setState],
    ),
    React.useCallback(
      function disable() {
        setState(false);
      },
      [setState],
    ),
    React.useCallback(
      function toggle() {
        setState((value) => !value);
      },
      [setState],
    ),
  ];
}

export function useOriginalValue<T>(value: T): T {
  const initialValue = React.useRef(value);
  React.useEffect(() => {
    if (typeof initialValue.current === 'undefined')
      initialValue.current = value;
  }, [value]);
  return initialValue.current;
}

export function useClientSide(): boolean {
  const [isClientSide, handleClientSide] = useBooleanState();
  React.useEffect(handleClientSide, [handleClientSide]);
  return isClientSide;
}
