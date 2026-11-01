import { useCallback, useState } from 'react';

// For one-off actions outside a form (eliminar, dar de baja, marcar pagado...):
// runs the action and, if the server rejects it, keeps a message to show
// instead of failing silently. Resolves to true when the action succeeded.
export function useActionError() {
  const [error, setError] = useState('');

  const run = useCallback(async (action, fallback = 'No se pudo completar la acción. Intentá de nuevo.') => {
    setError('');
    try {
      await action();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || fallback);
      return false;
    }
  }, []);

  return { error, run };
}
