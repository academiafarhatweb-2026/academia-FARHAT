import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { instrumentsApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { instrumentSchema } from '../../schemas';

const emptyValues = { name: '', order: '', isPublic: true };

export default function Instruments() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, submitting, openCreate, openEdit, close, submit, removeSelected } =
    useCrudModal(instrumentsApi);
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(instrumentSchema), defaultValues: emptyValues });

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
      reset({ name: selected.name, order: selected.order ?? '', isPublic: selected.isPublic });
    } else if (mode === 'create') {
      reset(emptyValues);
    }
  }, [mode, selected, reset]);

  function onValid(data) {
    submit({
      name: data.name.trim(),
      isPublic: data.isPublic,
      order: data.order === '' ? 0 : Number(data.order),
    });
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
              <tr><th>Orden</th><th>Nombre</th><th>Público</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  className={item._id === selectedId ? 'selected' : ''}
                  onClick={() => setSelectedId(item._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.order ?? 0}</td>
                  <td>{item.name}</td>
                  <td>{item.isPublic ? 'Si' : 'No'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="3">Sin registros.</td></tr>}
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
          <form onSubmit={handleSubmit(onValid)} noValidate>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" {...register('name')} />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="order">Orden (menor número = aparece primero)</label>
              <input id="order" type="number" min="0" step="1" {...register('order')} />
              {errors.order && <p className="error">{errors.order.message}</p>}
            </div>
            <div className="field">
              <label>
                <input type="checkbox" {...register('isPublic')} /> Mostrar en el Home
              </label>
            </div>
            {error && <p className="error mb-3">{error}</p>}
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
