import React from 'react';

import type { AvailableLanguages } from '../lib/languages';

export default React.createContext<AvailableLanguages['type']>('en-US');
