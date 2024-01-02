import LinkComponent from 'next/link';
import React from 'react';

import { error } from '../lib/assert';
import { split } from '../lib/helpers';
import type { IR, RA, RR } from '../lib/types';
import type { Input as InputType } from '../lib/types';
import { globalText } from '../localization/global';
import type { IconProps } from './Icons';
import { icons } from './Icons';

export type RawTagProps<TAG extends keyof React.ReactHTML> = Exclude<
  Parameters<React.ReactHTML[TAG]>[0],
  undefined | null
>;

/*
 * Forbid using regular "ref" since it needs to be forwarded
 * React.forwardRef has some typing issues when used with generics:
 * https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012
 * Instead, provide ref as a forwardRef. This does not change the runtime
 * behaviour
 */
export type TagProps<TAG extends keyof React.ReactHTML> = Omit<
  RawTagProps<TAG>,
  'ref'
> & {
  readonly ref?: 'Use "forwardRef" instead or "ref"';
  readonly forwardRef?: RawTagProps<TAG>['ref'];
};

export type HtmlElementFromTagName<TAG extends keyof React.ReactHTML> =
  React.ReactHTML[TAG] extends React.DetailedHTMLFactory<
    React.AnchorHTMLAttributes<infer X>,
    infer X
  >
    ? X
    : never;

/**
 * Add default className and props to common HTML elements in a type-safe way
 * Essentially function currying, but for React Components
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function wrap<
  TAG extends keyof React.ReactHTML,
  /*
   * Allows to define extra props that should be passed to the wrapped component
   * For example, can make some optional props be required, forbid passing
   * children, or mutate extra props using mergeProps callback
   */
  EXTRA_PROPS extends IR<unknown> = RR<never, never>,
>(
  // Would be shown in React DevTools
  name: string,
  tagName: TAG,
  className: string,
  initialProps?:
    | TagProps<TAG>
    | ((props: TagProps<TAG> & Readonly<EXTRA_PROPS>) => TagProps<TAG>),
) {
  const wrapped = (
    props: TagProps<TAG> & Readonly<EXTRA_PROPS>,
  ): JSX.Element => {
    // Merge classNames
    const fullClassName =
      typeof props?.className === 'string'
        ? `${className} ${props.className}`
        : className;
    const {
      forwardRef,
      ref: _,
      ...mergedProps
    } = typeof initialProps === 'function'
      ? initialProps({ ...props, className: fullClassName })
      : { ...initialProps, ...props, className: fullClassName };
    return React.createElement(tagName, {
      ...mergedProps,
      ref: forwardRef,
    });
  };
  wrapped.displayName = name;
  return wrapped;
}

const reduceMotion =
  typeof window === 'object'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
export const transitionDuration = reduceMotion ? 0 : 100;

export const darkMode =
  typeof window === 'object'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

/**
 * If dialog contains a button with this className, it will use that icon
 * by default
 */
// ClassNames are primarily for usage by non-react components
const niceButton = `rounded cursor-pointer active:brightness-80 px-4 py-2
  disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-neutral-700 gap-2
  inline-flex items-center capitalize`;
const containerBackground = 'bg-gray-200 dark:bg-neutral-800';
const baseContainer = `${containerBackground} flex flex-col gap-2 p-4 shadow-md
  shadow-gray-500 rounded`;
const rootText = 'text-black dark:text-white';
const rootBackground = 'bg-gray-200 dark:bg-neutral-900';
export const className = {
  rootBackground,
  containerBackground,
  // Do not show validation errors until tried to submit the form
  notSubmittedForm: 'not-submitted',
  // Or field lost focus
  notTouchedInput: 'not-touched',
  label: 'flex flex-col',
  labelForCheckbox: 'cursor-pointer inline-flex gap-x-1 items-center',
  button: 'button',
  link: 'link',
  transparentButton: `hover:bg-gray-300 hover:dark:bg-neutral-500
    text-gray-800 dark:text-neutral-200`,
  grayButton: `hover:bg-gray-400 bg-gray-300 text-gray-800
    dark:bg-neutral-600 dark:text-gray-100 hover:dark:bg-neutral-500`,
  redButton: `hover:bg-red-800 bg-red-700 text-white`,
  blueButton: `hover:bg-blue-700 bg-blue-600 text-white`,
  orangeButton: `hover:bg-orange-600 bg-orange-500 text-white`,
  greenButton: `hover:bg-green-800 bg-green-700 text-white`,
  h2: 'font-semibold text-black dark:text-white',
  miniCalendarDay: `flex items-center justify-center rounded-full w-6`,
  ariaHandled: 'aria-handled',
} as const;

export const Label = {
  Generic: wrap('Label.Generic', 'label', className.label),
  ForCheckbox: wrap('Label.ForCheckbox', 'label', className.labelForCheckbox),
};
export const Form = wrap(
  'Form',
  'form',
  `${className.notSubmittedForm} flex flex-col gap-4`,
  (props) => ({
    ...props,
    /*
     * Don't highlight invalid [required] and pattern mismatch fields until tried
     * to submit the form
     */
    onSubmit(event): void {
      const form = event.target as HTMLFormElement;
      if (form.classList.contains(className.notSubmittedForm))
        form.classList.remove(className.notSubmittedForm);
      if (typeof props?.onSubmit === 'function') {
        /*
         * If container has a <form>, and it summons a dialog (which uses a React
         * Portal) which renders another <form>, the child <form>, while not be
         * in the same DOM hierarchy, but would still have its onSubmit event
         * bubble (because React Portals resolve event bubbles).
         * Thus, have to stop propagation
         */
        event.stopPropagation();
        // Prevent default just so that I don't have to do it in the callback
        event.preventDefault();
        props.onSubmit(event);
      }
    },
  }),
);
/*
 * Don't highlight missing required and pattern mismatch fields until focus
 * loss
 */
const withHandleBlur = <TYPE extends InputType>(
  handleBlur: ((event: React.FocusEvent<TYPE>) => void) | undefined,
) => ({
  onBlur(event: React.FocusEvent<TYPE>): void {
    const input = event.target as TYPE;
    if (input.classList.contains(className.notTouchedInput))
      input.classList.remove(className.notTouchedInput);
    handleBlur?.(event);
  },
});
export const Input = {
  Radio: wrap<
    'input',
    {
      readOnly?: never;
      isReadOnly?: boolean;
      type?: never;
    }
  >('Input.Radio', 'input', 'h-3 w-3', ({ isReadOnly, ...props }) => ({
    ...props,
    type: 'radio',
    readOnly: isReadOnly,
  })),
  Checkbox: wrap<
    'input',
    {
      onValueChange?: (isChecked: boolean) => void;
      readOnly?: never;
      isReadOnly?: boolean;
      type?: never;
    }
  >(
    'Input.Checkbox',
    'input',
    'h-3 w-3',
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'checkbox',
      onChange(event): void {
        onValueChange?.((event.target as HTMLInputElement).checked);
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    }),
  ),
  Text: wrap<
    'input',
    {
      onValueChange?: (value: string) => void;
      type?: 'If you need to specify type, use Input.Generic';
      readOnly?: never;
      isReadOnly?: boolean;
    }
  >(
    'Input.Text',
    'input',
    className.notTouchedInput,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'text',
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.((event.target as HTMLInputElement).value);
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    }),
  ),
  Generic: wrap<
    'input',
    {
      onValueChange?: (value: string) => void;
      readOnly?: never;
      isReadOnly?: boolean;
    }
  >(
    'Input.Generic',
    'input',
    className.notTouchedInput,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.((event.target as HTMLInputElement).value);
        props.onChange?.(event);
      },
      onPaste(event): void {
        const target = event.target as HTMLInputElement;
        // Handle pasting dates into input[type="date"]
        if (target.type === 'date') {
          const input =
            target.tagName === 'INPUT'
              ? target
              : target.getElementsByTagName('input')[0];
          const initialType = input.type;
          input.type = 'text';
          try {
            // @ts-expect-error
            input.value = (event.clipboardData ?? window.clipboardData).getData(
              'text/plain',
            );
            if (typeof onValueChange === 'function') onValueChange(input.value);
            else if (typeof props.onChange === 'function')
              props.onChange(
                event as unknown as React.ChangeEvent<HTMLInputElement>,
              );
            else
              console.error('Input does not have an onChange event listener', {
                event,
              });
          } catch (error: unknown) {
            console.error(error);
          }

          event.preventDefault();
          input.type = initialType;
        }
        props.onPaste?.(event);
      },
      readOnly: isReadOnly,
    }),
  ),
  Number: wrap<
    'input',
    {
      onValueChange?: (value: number) => void;
      type?: never;
      readOnly?: never;
      isReadOnly?: boolean;
    }
  >(
    'Input.Number',
    'input',
    className.notTouchedInput,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'number',
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.(
          Number.parseInt((event.target as HTMLInputElement).value),
        );
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    }),
  ),
};
export const Textarea = wrap<
  'textarea',
  {
    children?: undefined;
    onValueChange?: (value: string) => void;
    readOnly?: never;
    isReadOnly?: boolean;
  }
>(
  'Textarea',
  'textarea',
  // Ensures Textarea can't grow past max dialog width
  `${className.notTouchedInput} resize max-w-full min-w-[theme(spacing.20)] min-h-[theme(spacing.8)]`,
  ({ onValueChange, isReadOnly, ...props }) => ({
    ...props,
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      onValueChange?.((event.target as HTMLTextAreaElement).value);
      props.onChange?.(event);
    },
    readOnly: isReadOnly,
  }),
);
export const selectMultipleSize = 4;
export const Select = wrap<
  'select',
  {
    readonly onValueChange?: (value: string) => void;
    readonly onValuesChange?: (value: RA<string>) => void;
  }
>(
  'Select',
  'select',
  className.notTouchedInput,
  ({ onValueChange, onValuesChange, ...props }) => ({
    ...props,
    /*
     * Required fields have blue background. Selected <option> in a select
     * multiple also has blue background. Those clash. Need to make required
     * select background slightly lighter
     */
    className: `${props.className ?? ''}${
      props.required === true &&
      (props.multiple === true ||
        (typeof props.size === 'number' && props.size > 1))
        ? ' bg-blue-100 dark:bg-blue-900'
        : ''
    }`,
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      const options = Array.from(
        (event.target as HTMLSelectElement).querySelectorAll('option'),
      );
      const [unselected, selected] = split(options, ({ selected }) => selected);
      /*
       * Selected options in an optional multiple select are clashing with
       * the background in dark mode. This is a fix:
       */
      if (props.required !== true && props.multiple === true) {
        selected.map((option) => option.classList.add('dark:bg-neutral-100'));
        unselected.map((option) =>
          option.classList.remove('dark:bg-neutral-100'),
        );
      }
      onValueChange?.((event.target as HTMLSelectElement).value);
      onValuesChange?.(selected.map(({ value }) => value));
      props.onChange?.(event);
    },
  }),
);

export const Link = {
  Default({
    children,
    ref: _,
    forwardRef: ref,
    ...props
  }: TagProps<'a'> & { readonly href: string }): JSX.Element {
    return (
      <LinkComponent
        {...props}
        ref={typeof ref === 'string' ? undefined : ref}
        className={`${className.link} ${props.className ?? ''}`}
      >
        {children}
      </LinkComponent>
    );
  },
  NewTab({ children, ...props }: TagProps<'a'>): JSX.Element {
    return (
      <a
        {...props}
        target="_blank"
        className={`${className.link} ${props.className ?? ''}`}
      >
        {children}
        <span
          title={globalText('opensInNewTab')}
          aria-label={globalText('opensInNewTab')}
        >
          {icons.externalLink}
        </span>
      </a>
    );
  },
  LikeButton({
    children,
    ref: _,
    forwardRef: ref,
    ...props
  }: TagProps<'a'> & { readonly href: string }): JSX.Element {
    return (
      <LinkComponent
        {...props}
        ref={typeof ref === 'string' ? undefined : ref}
        className={`${className.button} ${props.className ?? ''}`}
      >
        {children}
      </LinkComponent>
    );
  },
  LikeFancyButton({
    children,
    ref: _,
    forwardRef: ref,
    ...props
  }: TagProps<'a'> & { readonly href: string }): JSX.Element {
    return (
      <LinkComponent
        {...props}
        ref={typeof ref === 'string' ? undefined : ref}
        className={`${niceButton} ${props.className ?? ''}`}
      >
        {children}
      </LinkComponent>
    );
  },
  Icon({
    icon,
    ref: _,
    forwardRef: ref,
    ...props
  }: TagProps<'a'> & IconProps & { readonly href: string }): JSX.Element {
    return (
      <LinkComponent
        {...props}
        ref={typeof ref === 'string' ? undefined : ref}
        className={`${className.link} rounded ${props.className ?? ''}`}
      >
        {icons[icon]}
      </LinkComponent>
    );
  },
} as const;

export const DialogContext = React.createContext<(() => void) | undefined>(() =>
  error('DialogContext can only be used by <Dialog> buttons'),
);
DialogContext.displayName = 'DialogContext';

/**
 * A button that registers its onClick handler to containing dialog's
 * onClose handler.
 *
 * This is useful to avoid duplicating the dialog close logic
 * in the button's onClick and the dialog's onClose
 */
function DialogCloseButton({
  component: ButtonComponent = Button.Transparent,
  ...props
}: Omit<Parameters<typeof Button.Transparent>[0], 'onClick'> & {
  readonly component?: typeof Button.Transparent;
}): JSX.Element {
  const handleClose = React.useContext(DialogContext);
  if (typeof handleClose === 'undefined')
    throw new Error("Dialog's handleClose prop is undefined");
  return <ButtonComponent {...props} onClick={handleClose} />;
}

const button = (name: string, className: string) =>
  wrap(name, 'button', className, {
    type: 'button',
  });
export const Button = {
  Simple: button('Button.Simple', className.button),
  /*
   * When using Button.LikeLink component, consider adding [role="link"] if the
   * element should be announced as a link
   */
  LikeLink: button('Button.LikeLink', className.link),
  Transparent: button(
    'Button.Transparent',
    `${niceButton} ${className.transparentButton}`,
  ),
  Gray: button('Button.Gray', `${niceButton} ${className.grayButton}`),
  Red: button('Button.Red', `${niceButton} ${className.redButton}`),
  Blue: button('Button.Blue', `${niceButton} ${className.blueButton}`),
  Orange: button('Button.Orange', `${niceButton} ${className.orangeButton}`),
  Green: button('Button.Green', `${niceButton} ${className.greenButton}`),
  DialogClose: DialogCloseButton,
  Icon: wrap<'button', IconProps>(
    'Button.Icon',
    'button',
    `${className.link} rounded`,
    (props) => ({
      ...props,
      type: 'button',
      children: icons[props.icon],
    }),
  ),
} as const;

type SubmitProps = {
  readonly children: string;
  readonly value?: undefined;
};
const submitButton = (name: string, buttonClassName: string) =>
  wrap<'input', SubmitProps>(
    name,
    'input',
    buttonClassName,
    ({
      children,
      ...props
    }: TagProps<'input'> & SubmitProps): TagProps<'input'> => ({
      type: 'submit',
      ...props,
      value: children,
    }),
  );
export const Submit = {
  // Force passing children by nesting rather than through the [value] attribute
  Simple: submitButton('Submit.Simple', className.button),
  Transparent: submitButton(
    'Submit.Transparent',
    `${niceButton} ${className.transparentButton}`,
  ),
  Gray: submitButton('Submit.Gray', `${niceButton} ${className.grayButton}`),
  Red: submitButton('Submit.Red', `${niceButton} ${className.redButton}`),
  Blue: submitButton('Submit.Blue', `${niceButton} ${className.blueButton}`),
  Orange: submitButton(
    'Submit.Orange',
    `${niceButton} ${className.orangeButton}`,
  ),
  Green: submitButton('Submit.Green', `${niceButton} ${className.greenButton}`),
} as const;

export const Container = {
  Generic: wrap(
    'Container.Generic',
    'section',
    `${baseContainer} ${rootBackground} ${rootText}
      max-w-[min(100%,1200px)] mx-auto`,
  ),
  Full: wrap(
    'Container.Full',
    'section',
    `bg-gray-100 dark:bg-neutral-800 rounded border border-gray-300 dark:border-neutral-700 `,
  ),
  Quartered: wrap(
    'Container.Quartered',
    'main',
    `h-screen flex flex-col gap-2 grid ${rootBackground} ${rootText}
      grid-cols-[256px_1fr] grid-rows-[min-content_1fr] p-4`,
  ),
};

// Need to set explicit [role] for list without bullets to be announced as a list
export const Ul = wrap('Ul', 'ul', '', { role: 'list' });

/* eslint-enable @typescript-eslint/naming-convention */
