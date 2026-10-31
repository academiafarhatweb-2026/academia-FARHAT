import { createContext } from 'react';

// Lives apart from ConfirmProvider so that file only exports components
// (keeps React Fast Refresh working).
export const ConfirmContext = createContext(null);
