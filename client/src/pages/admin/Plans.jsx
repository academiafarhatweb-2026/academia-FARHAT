import { useEffect, useState } from 'react';
import { plansApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';

const emptyForm = { name: '', value: '', classesIncluded: '' };

export default function Plans() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, openCreate, openEdit, close, submit, removeSelected } =
    useCrudModal(plansApi);
  const [form, setForm] = useState(emptyForm);
  const confirm = useConfirm();

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
      setForm({ name: selected.name, value: selected.value, classesIncluded: selected.classesIncluded });
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
  }, [mode, selected]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit({ name: form.name, value: Number(form.value), classesIncluded: Number(form.classesIncluded) });
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
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="planName">Nombre</label>
              <input id="planName" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="planValue">Valor ($)</label>
              <input id="planValue" type="number" value={form.value} onChange={(e) => setField('value', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="planClasses">Clases incluidas</label>
              <input id="planClasses" type="number" value={form.classesIncluded} onChange={(e) => setField('classesIncluded', e.target.value)} />
            </div>
            {error && <p className="error mb-3">{error}</p>}
            <button className="btn" type="submit">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
