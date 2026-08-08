import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teachersApi, instrumentsApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { teacherSchema } from '../../schemas';

const emptyValues = { name: '', phone: '', email: '', rates: [] };

export default function Teachers() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, submitting, openCreate, openEdit, close, submit, removeSelected } =
    useCrudModal(teachersApi);
  const [instruments, setInstruments] = useState([]);
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(teacherSchema), defaultValues: emptyValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'rates' });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar profesor',
      message: `Esto elimina a "${selected?.name}". Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (ok) removeSelected();
  }

  useEffect(() => {
    instrumentsApi.list().then(setInstruments);
  }, []);

  useEffect(() => {
    if (mode === 'edit' && selected) {
      reset({
        name: selected.name,
        phone: selected.phone || '',
        email: selected.email || '',
        rates: selected.rates.map((r) => ({ instrument: r.instrument._id || r.instrument, percentage: String(r.percentage) })),
      });
    } else if (mode === 'create') {
      reset(emptyValues);
    }
  }, [mode, selected, reset]);

  function addRate() {
    if (instruments.length === 0) return;
    append({ instrument: instruments[0]._id, percentage: '40' });
  }

  function onValid(data) {
    submit({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      rates: data.rates.map((r) => ({ instrument: r.instrument, percentage: Number(r.percentage) })),
    });
  }

  function instrumentName(id) {
    return instruments.find((i) => i._id === id)?.name || '';
  }

  return (
    <div>
      <h1>Profesores</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Contacto</th><th>Comisiones</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className={item._id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(item._id)} style={{ cursor: 'pointer' }}>
                  <td>{item.name}</td>
                  <td>{item.phone} {item.email}</td>
                  <td>
                    {item.rates.map((r, i) => (
                      <div key={i}>{r.instrument?.name || instrumentName(r.instrument) || 'Instrumento eliminado'}: {r.percentage}%</div>
                    ))}
                  </td>
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
        <Modal title={mode === 'edit' ? 'Modificar profesor' : 'Nuevo profesor'} onClose={close}>
          <form onSubmit={handleSubmit(onValid)} noValidate>
            <div className="field">
              <label htmlFor="teacherName">Nombre</label>
              <input id="teacherName" {...register('name')} />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="teacherPhone">Teléfono</label>
              <input id="teacherPhone" type="tel" {...register('phone')} />
              {errors.phone && <p className="error">{errors.phone.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="teacherEmail">Email</label>
              <input id="teacherEmail" type="email" {...register('email')} />
              {errors.email && <p className="error">{errors.email.message}</p>}
            </div>

            <div className="field">
              <label>Comisión por instrumento (%)</label>
              {fields.map((field, i) => (
                <div key={field.id}>
                  <div className="flex-row" style={{ marginBottom: 6 }}>
                    <select {...register(`rates.${i}.instrument`)}>
                      {instruments.map((inst) => <option key={inst._id} value={inst._id}>{inst.name}</option>)}
                    </select>
                    <input type="number" style={{ width: 80 }} step="0.01" {...register(`rates.${i}.percentage`)} />
                    <button type="button" className="btn danger" onClick={() => remove(i)}>Quitar</button>
                  </div>
                  {errors.rates?.[i]?.percentage && <p className="error">{errors.rates[i].percentage.message}</p>}
                </div>
              ))}
              <button type="button" className="btn secondary" onClick={addRate}>+ Agregar comisión</button>
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
