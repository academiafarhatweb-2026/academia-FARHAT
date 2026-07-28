import { useEffect, useState } from 'react';
import { teachersApi, instrumentsApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { PERSON_NAME_PATTERN, PERSON_NAME_TITLE, PHONE_PATTERN, PHONE_TITLE, PHONE_MAXLENGTH, EMAIL_PATTERN, EMAIL_TITLE } from '../../utils/validation';

const emptyForm = { name: '', phone: '', email: '', rates: [] };

export default function Teachers() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, submitting, openCreate, openEdit, close, submit, removeSelected } =
    useCrudModal(teachersApi);
  const [instruments, setInstruments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const confirm = useConfirm();

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
      setForm({
        name: selected.name,
        phone: selected.phone || '',
        email: selected.email || '',
        rates: selected.rates.map((r) => ({ instrument: r.instrument._id || r.instrument, percentage: r.percentage })),
      });
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
  }, [mode, selected]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addRate() {
    if (instruments.length === 0) return;
    setForm((f) => ({ ...f, rates: [...f.rates, { instrument: instruments[0]._id, percentage: 40 }] }));
  }

  function updateRate(index, field, value) {
    setForm((f) => ({ ...f, rates: f.rates.map((r, i) => (i === index ? { ...r, [field]: value } : r)) }));
  }

  function removeRate(index) {
    setForm((f) => ({ ...f, rates: f.rates.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit({ ...form, rates: form.rates.map((r) => ({ instrument: r.instrument, percentage: Number(r.percentage) })) });
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
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="teacherName">Nombre</label>
              <input
                id="teacherName"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
                minLength={2}
                maxLength={80}
                pattern={PERSON_NAME_PATTERN}
                title={PERSON_NAME_TITLE}
              />
            </div>
            <div className="field">
              <label htmlFor="teacherPhone">Teléfono</label>
              <input
                id="teacherPhone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                maxLength={PHONE_MAXLENGTH}
                pattern={PHONE_PATTERN}
                title={PHONE_TITLE}
              />
            </div>
            <div className="field">
              <label htmlFor="teacherEmail">Email</label>
              <input
                id="teacherEmail"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                maxLength={100}
                pattern={EMAIL_PATTERN}
                title={EMAIL_TITLE}
              />
            </div>

            <div className="field">
              <label>Comisión por instrumento (%)</label>
              {form.rates.map((rate, i) => (
                <div key={i} className="flex-row" style={{ marginBottom: 6 }}>
                  <select value={rate.instrument} onChange={(e) => updateRate(i, 'instrument', e.target.value)}>
                    {instruments.map((inst) => <option key={inst._id} value={inst._id}>{inst.name}</option>)}
                  </select>
                  <input
                    type="number"
                    style={{ width: 80 }}
                    value={rate.percentage}
                    onChange={(e) => updateRate(i, 'percentage', e.target.value)}
                    required
                    min={0}
                    max={100}
                    step="0.01"
                  />
                  <button type="button" className="btn danger" onClick={() => removeRate(i)}>Quitar</button>
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
