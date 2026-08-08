import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { plansApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { planSchema } from '../../schemas';

const emptyValues = { name: '', value: '', classesIncluded: '' };

export default function Plans() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, submitting, openCreate, openEdit, close, submit, removeSelected } =
    useCrudModal(plansApi);
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(planSchema), defaultValues: emptyValues });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar plan',
      message: `Esto elimina "${selected?.name}". Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (ok) removeSelected();
  }

  useEffect(() => {
    if (mode === 'edit' && selected) {
      reset({ name: selected.name, value: String(selected.value), classesIncluded: String(selected.classesIncluded) });
    } else if (mode === 'create') {
      reset(emptyValues);
    }
  }, [mode, selected, reset]);

  function onValid(data) {
    submit({ name: data.name.trim(), value: Number(data.value), classesIncluded: Number(data.classesIncluded) });
  }

  return (
    <div>
      <h1>Planes</h1>
      <p className="mb-4 text-sm text-ink/60">
        Ej: "Promo 1" = 45000 / 4 clases. Para pago por clase suelta ("XCLASE"), usar classesIncluded = 1.
      </p>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Valor</th><th>Clases incluidas</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className={item._id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(item._id)} style={{ cursor: 'pointer' }}>
                  <td>{item.name}</td>
                  <td>${item.value}</td>
                  <td>{item.classesIncluded}</td>
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
        <Modal title={mode === 'edit' ? 'Modificar plan' : 'Nuevo plan'} onClose={close}>
          <form onSubmit={handleSubmit(onValid)} noValidate>
            <div className="field">
              <label htmlFor="planName">Nombre</label>
              <input id="planName" {...register('name')} />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="planValue">Valor ($)</label>
              <input id="planValue" type="number" step="0.01" {...register('value')} />
              {errors.value && <p className="error">{errors.value.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="planClasses">Clases incluidas</label>
              <input id="planClasses" type="number" step="1" {...register('classesIncluded')} />
              {errors.classesIncluded && <p className="error">{errors.classesIncluded.message}</p>}
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
