import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

// App-wide replacement for window.confirm — styled like the rest of the app
// instead of the browser's native dialog. useConfirm() returns an async
// confirm(options) that resolves true/false, same call shape as window.confirm.
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    setState(typeof options === 'string' ? { message: options } : options);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handle(result) {
    setState(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => handle(false)}>
          <div className="modal-panel" style={{ maxWidth: 420, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            {state.title && <h2 className="mb-2">{state.title}</h2>}
            <p className="mb-6 text-sm text-ink/70">{state.message}</p>
            <div className="flex-row" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn secondary" onClick={() => handle(false)}>
                {state.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                className={state.danger ? 'btn danger' : 'btn'}
                onClick={() => handle(true)}
                autoFocus
              >
                {state.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
