'use strict';

/*
 * This config partially overwrites and extends the default Tailwind config:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  content: ['./components/*.tsx', './pages/*.tsx'],
  corePlugins: {
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
  },
  darkMode: 'media',
  theme: {
    borderRadius: {
      none: '0px',
      xs: '0.125rem',
      sm: '0.25rem',
      DEFAULT: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    extend: {
      colors: {
        // Specify 7 orange colors:
        brand: {
          100: 'hsl(27deg 100% 82%)',
          200: 'hsl(27deg 100% 63%)',
          300: 'hsl(27deg 100% 55%)',
          400: 'hsl(27deg 100% 41%)',
          500: 'hsl(27deg 100% 22%)',
        },
        // Some in-between shades:
        gray: {
          350: 'hsl(218deg 12% 79%)',
        },
        yellow: {
          250: 'hsl(53deg 98% 72%)',
        },
        indigo: {
          350: 'hsl(232deg 92% 79%)',
        },
        neutral: {
          350: 'hsl(0deg 0% 73%)',
        },
      },
      brightness: {
        70: '.7',
        80: '.8',
      },
      transitionDuration: {
        0: '0ms',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
