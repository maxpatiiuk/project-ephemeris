import React from 'react';

import { globalText } from '../localization/global';
import { Input } from './Basic';
import { iconClassName } from './Icons';

export function ColorPicker({
  color,
  onChange: handleChange,
}: {
  readonly color: string;
  readonly onChange: (color: string) => void;
}): JSX.Element {
  return (
    <>
      <span
        className={`${iconClassName} rounded-full`}
        style={{
          backgroundColor: color,
        }}
      />
      <span className="sr-only">{globalText('color')}</span>
      <Input.Generic
        className={`sr-only`}
        type="color"
        value={color}
        onValueChange={handleChange}
      />
    </>
  );
}
