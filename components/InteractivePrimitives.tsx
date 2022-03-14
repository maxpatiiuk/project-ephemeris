import React from 'react';

const baseButtonStyle =
  'inline-flex px-4 py-2 rounded-md sm:text-sm sm:w-auto text-gray-700';

interface ButtonProps {
  readonly children: React.ReactNode;
  readonly props?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  readonly extraStyles?: string;
  readonly baseStyles?: string;
}

function Button({
  children,
  props = {},
  baseStyles = '',
  extraStyles = '',
}: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={`${baseStyles} ${baseButtonStyle} ${extraStyles}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonDanger({ children, ...props }: ButtonProps): JSX.Element {
  return (
    <Button baseStyles={'bg-red-600 hover:bg-red-700'} {...props}>
      {children}
    </Button>
  );
}
