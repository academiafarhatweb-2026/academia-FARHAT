import { useContext } from 'react';
import { ConfirmContext } from '../context/confirmContextValue';

// Returns an async confirm(options) that resolves true/false — see ConfirmProvider.
export function useConfirm() {
  return useContext(ConfirmContext);
}
