import { useState } from 'react';
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
    }
  }

  async function removeSelected() {
    if (!selectedId) return;
    setError('');
    try {
      await crud.remove(selectedId);
      setSelectedId(null);
    } catch (err) {
      setError(extractMessage(err));
    }
  }

  return { ...crud, selectedId, setSelectedId, selected, mode, error, openCreate, openEdit, close, submit, removeSelected };
}
