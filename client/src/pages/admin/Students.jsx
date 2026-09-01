import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentsApi } from '../../api/catalog';
import { enrollmentsApi } from '../../api/enrollments';
import { useCrudModal } from '../../hooks/useCrudModal';
import { usePagination } from '../../hooks/usePagination';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import ExpirationBadge from '../../components/ExpirationBadge';
import { dayLabel } from '../../utils/days';
import { useConfirm } from '../../context/ConfirmContext';
import { studentSchema } from '../../schemas';

const emptyValues = { name: '', email: '', phone: '', active: true };

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
  const confirm = useConfirm();
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(studentSchema), defaultValues: emptyValues });

  useEffect(() => {
    if (mode === 'edit' && selected) {
      reset({ name: selected.name, email: selected.email, phone: selected.phone || '', active: selected.active !== false });
    } else if (mode === 'create') {
      reset(emptyValues);
    }
  }, [mode, selected, reset]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q));
  }, [items, search]);
  const { page, setPage, totalPages, pageItems } = usePagination(filteredItems, 10);

  function onValid(data) {
    submit({ name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(), active: data.active });
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

      <div className="flex-row mb-4">
        <button className="btn" onClick={openCreate}>Nueva</button>
        <button className="btn secondary" onClick={openEdit} disabled={!selectedId}>Modificar</button>
        <button className="btn secondary" onClick={toggleActive} disabled={!selectedId}>
          {selected?.active === false ? 'Dar de alta' : 'Dar de baja'}
        </button>
        <button className="btn danger" onClick={handleHardDelete} disabled={!selectedId}>Eliminar definitivamente</button>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Estado</th><th>Pago</th><th>Clases</th><th>Vencimiento</th></tr></thead>
            <tbody>
              {pageItems.map((item) => (
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
              {pageItems.length === 0 && <tr><td colSpan="7">Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {mode && (
        <Modal title={mode === 'edit' ? 'Modificar alumno' : 'Nuevo alumno'} onClose={close}>
          <form onSubmit={handleSubmit(onValid)} noValidate>
            <div className="field">
              <label htmlFor="studentName">Nombre</label>
              <input id="studentName" {...register('name')} />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="studentEmail">Email</label>
              <input id="studentEmail" type="email" {...register('email')} />
              {errors.email && <p className="error">{errors.email.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="studentPhone">Teléfono</label>
              <input id="studentPhone" type="tel" {...register('phone')} />
              {errors.phone && <p className="error">{errors.phone.message}</p>}
            </div>
            {mode === 'edit' && (
              <div className="field">
                <label htmlFor="studentActive">Estado</label>
                <select id="studentActive" {...register('active', { setValueAs: (v) => v === 'true' })}>
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
