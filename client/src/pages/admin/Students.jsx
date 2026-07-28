import { useEffect, useState } from 'react';
import { studentsApi } from '../../api/catalog';
import { enrollmentsApi } from '../../api/enrollments';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import ExpirationBadge from '../../components/ExpirationBadge';
import { dayLabel } from '../../utils/days';
import { useConfirm } from '../../context/ConfirmContext';
import { PERSON_NAME_PATTERN, PERSON_NAME_TITLE, PHONE_PATTERN, PHONE_TITLE, PHONE_MAXLENGTH, EMAIL_PATTERN, EMAIL_TITLE } from '../../utils/validation';

const emptyForm = { name: '', email: '', phone: '', active: true };

function scheduleLines(schedule) {
  const byDay = new Map();
  for (const s of schedule || []) {
    if (!byDay.has(s.day)) byDay.set(s.day, []);
    byDay.get(s.day).push(`${s.startHour}-${s.endHour}hs`);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, ranges]) => `${dayLabel(day).slice(0, 3)} ${ranges.join(' / ')}`)
    .join(', ');
}

export default function Students() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, submitting, openCreate, openEdit, close, submit, update, reload } =
    useCrudModal(studentsApi);
  const [form, setForm] = useState(emptyForm);
  const confirm = useConfirm();

  useEffect(() => {
    if (mode === 'edit' && selected) {
      setForm({ name: selected.name, email: selected.email, phone: selected.phone || '', active: selected.active !== false });
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
  }, [mode, selected]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    submit(form);
  }

  async function toggleActive() {
    if (!selected) return;
    await update(selectedId, { active: !selected.active });
  }

  async function setEnrollmentPaid(enrollment, paid) {
    await enrollmentsApi.update(enrollment._id, { paid });
    reload();
  }

  async function handleHardDelete() {
    if (!selected) return;
    const ok = await confirm({
      title: 'Eliminar alumno',
      message: `Esto elimina a ${selected.name} para siempre, sin poder deshacerlo. Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await studentsApi.hardRemove(selectedId);
    setSelectedId(null);
    reload();
  }

  return (
    <div>
      <h1>Alumnos</h1>
      <p className="mb-4 text-sm text-ink/60">
        El alumno ingresa solo con su email, sin contraseña. Alcanza con cargarlo acá.
      </p>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Estado</th><th>Pago</th><th>Clases</th><th>Vencimiento</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className={item._id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(item._id)} style={{ cursor: 'pointer' }}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>
                    <span className={item.active ? 'badge badge-active' : 'badge badge-neutral'}>
                      {item.active ? 'Activo' : 'De baja'}
                    </span>
                  </td>
                  <td>
                    {item.enrollments?.length > 0 ? (
                      item.enrollments.map((e, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <span className={e.paid ? 'badge badge-active' : 'badge badge-expired'}>
                            {e.paid ? 'Si' : 'No'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-ink/40">-</span>
                    )}
                  </td>
                  <td>
                    {item.enrollments?.length > 0 ? (
                      item.enrollments.map((e, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <div className="text-xs font-semibold text-ink">{e.instrumentNames}</div>
                          {e.teacherNames && <div className="text-xs text-ink/60">Prof. {e.teacherNames}</div>}
                          {e.schedule?.length > 0 && (
                            <div className="font-mono text-xs text-ink/60">{scheduleLines(e.schedule)}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-ink/40">Sin inscripción</span>
                    )}
                  </td>
                  <td>
                    {item.enrollments?.length > 0 ? (
                      item.enrollments.map((e, i) => (
                        <div key={i} className="flex-row" style={{ marginBottom: 6 }}>
                          <ExpirationBadge status={e.expirationStatus} />
                          {e.nextDueDate && (
                            <span className="font-mono text-xs text-ink/60">
                              {new Date(e.nextDueDate).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-ink/40">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="7">Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex-row mt-16">
        <button className="btn" onClick={openCreate}>Nueva</button>
        <button className="btn secondary" onClick={openEdit} disabled={!selectedId}>Modificar</button>
        <button className="btn secondary" onClick={toggleActive} disabled={!selectedId}>
          {selected?.active === false ? 'Dar de alta' : 'Dar de baja'}
        </button>
        <button className="btn danger" onClick={handleHardDelete} disabled={!selectedId}>Eliminar definitivamente</button>
      </div>

      {mode && (
        <Modal title={mode === 'edit' ? 'Modificar alumno' : 'Nuevo alumno'} onClose={close}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="studentName">Nombre</label>
              <input
                id="studentName"
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
              <label htmlFor="studentEmail">Email</label>
              <input
                id="studentEmail"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                required
                maxLength={100}
                pattern={EMAIL_PATTERN}
                title={EMAIL_TITLE}
              />
            </div>
            <div className="field">
              <label htmlFor="studentPhone">Teléfono</label>
              <input
                id="studentPhone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                maxLength={PHONE_MAXLENGTH}
                pattern={PHONE_PATTERN}
                title={PHONE_TITLE}
              />
            </div>
            {mode === 'edit' && (
              <div className="field">
                <label htmlFor="studentActive">Estado</label>
                <select id="studentActive" value={form.active ? 'true' : 'false'} onChange={(e) => setField('active', e.target.value === 'true')}>
                  <option value="true">Activo</option>
                  <option value="false">De baja</option>
                </select>
              </div>
            )}
            {mode === 'edit' && (
              <div className="field">
                <label>Pago</label>
                {selected?.enrollments?.length > 0 ? (
                  selected.enrollments.map((e, i) => (
                    <div key={i} className="flex-row" style={{ marginBottom: 4 }}>
                      <span className="text-xs text-ink/60" style={{ minWidth: 90 }}>{e.instrumentNames}</span>
                      <select
                        value={e.paid ? 'true' : 'false'}
                        onChange={(ev) => setEnrollmentPaid(e, ev.target.value === 'true')}
                      >
                        <option value="true">Pagado</option>
                        <option value="false">No pagado</option>
                      </select>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-ink/40">Sin inscripción</span>
                )}
              </div>
            )}
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
