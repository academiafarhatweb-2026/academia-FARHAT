import { useEffect, useState } from 'react';
import { instrumentsApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';

export default function Instruments() {
  const crud = useCrudModal(instrumentsApi);
  const { items, loading, selectedId, setSelectedId, selected, mode, error, openCreate, openEdit, close, submit, removeSelected } = crud;
  const confirm = useConfirm();

  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar instrumento',
      message: `Esto elimina "${selected?.name}". Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (ok) removeSelected();
  }

  useEffect(() => {
    if (mode === 'edit' && selected) {
      setName(selected.name);
      setIsPublic(selected.isPublic);
    } else if (mode === 'create') {
      setName('');
      setIsPublic(true);
    }
  }, [mode, selected]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    submit({ name, isPublic });
  }

  return (
    <div>
      <h1>Instrumentos</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Publico</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  className={item._id === selectedId ? 'selected' : ''}
                  onClick={() => setSelectedId(item._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.name}</td>
                  <td>{item.isPublic ? 'Si' : 'No'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="2">Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex-row mt-16">
        <button className="btn" onClick={openCreate}>Nueva</button>
        <button className="btn secondary" onClick={openEdit} disabled={!selectedId}>Modificar</button>
        <button className="btn danger" onClick={handleDelete} disabled={!selectedId}>Eliminar</button>
      </div>

      {mode && (
        <Modal title={mode === 'edit' ? 'Modificar instrumento' : 'Nuevo instrumento'} onClose={close}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Mostrar en el Home
              </label>
            </div>
            {error && <p className="error mb-3">{error}</p>}
            <button className="btn" type="submit">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
