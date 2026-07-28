import { useRef, useState } from 'react';
import { useCrud } from './useCrud';

function extractMessage(err) {
  return err.response?.data?.message || 'Ocurrio un error. Intenta de nuevo.';
}

// Adds the Nueva/Modificar/Eliminar + modal selection state on top of useCrud,
// mirroring the legacy list-and-modal workflow.
export function useCrudModal(api) {
  const crud = useCrud(api);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'edit' | null
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // A ref lock, not just the submitting state: state updates are batched/async,
  // so two clicks fired back-to-back before the first render flushes could both
  // read the old "not submitting" value and both slip through.
  const submittingRef = useRef(false);

  const selected = crud.items.find((i) => i._id === selectedId) || null;

  function openCreate() {
    setError('');
    setMode('create');
  }

  function openEdit() {
    if (!selectedId) return;
    setError('');
    setMode('edit');
  }

  function close() {
    setError('');
    setMode(null);
  }

  async function submit(data) {
    // Guards against a double-click (or double form-submit event) firing two
    // create/update requests before the modal has a chance to close.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'edit' && selectedId) {
        await crud.update(selectedId, data);
      } else {
        await crud.create(data);
      }
      close();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function removeSelected() {
    if (!selectedId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      await crud.remove(selectedId);
      setSelectedId(null);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return { ...crud, selectedId, setSelectedId, selected, mode, error, submitting, openCreate, openEdit, close, submit, removeSelected };
}
