import { Fragment, useEffect, useState } from 'react';
import { classesApi, instrumentsApi, teachersApi } from '../../api/catalog';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import ClassForm from '../../components/ClassForm';
import { dayLabel } from '../../utils/days';
import { useConfirm } from '../../context/ConfirmContext';

// Merges same-day entries (e.g. two separate 17-19 / 19-21 records for the
// same teacher+instrument+day) into a single "Martes 17-19, 19-21" line,
// keeping the first underlying class id as the one Modificar/Eliminar act on.
function buildDayRows(items) {
  const byDay = new Map();
  for (const item of items) {
    for (const s of item.slots) {
      if (!byDay.has(s.day)) byDay.set(s.day, { day: s.day, slots: [], primaryId: item._id });
      byDay.get(s.day).slots.push(s);
    }
  }
  return [...byDay.values()]
    .sort((a, b) => a.day - b.day)
    .map((row) => ({
      ...row,
      label: `${dayLabel(row.day)} ${row.slots
        .sort((a, b) => a.startHour - b.startHour)
        .map((s) => `${s.startHour}-${s.endHour}`)
        .join(', ')}`,
    }));
}

export default function Classes() {
  const { items, loading, selectedId, setSelectedId, selected, mode, error, openCreate, openEdit, close, submit, removeSelected } =
    useCrudModal(classesApi);
  const [instruments, setInstruments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar clase',
      message: `Esto elimina "${selected?.instrument?.name} - ${selected?.teacher?.name}" de ese día. Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (ok) removeSelected();
  }

  useEffect(() => {
    instrumentsApi.list().then(setInstruments);
    teachersApi.list().then(setTeachers);
  }, []);

  const filteredItems = items.filter(
    (item) =>
      (!filterInstrument || item.instrument?._id === filterInstrument) &&
      (!filterTeacher || item.teacher?._id === filterTeacher)
  );

  // One group per instrument+teacher; within each, one row per day (merged).
  // A class can end up with a dangling instrument/teacher reference if that
  // catalog entry was deleted without cleaning up the class — show it with a
  // clear label instead of crashing, so it can still be fixed or removed here.
  const groups = new Map();
  for (const item of filteredItems) {
    const key = `${item.instrument?._id || 'sin-instrumento'}-${item.teacher?._id || 'sin-profesor'}`;
    if (!groups.has(key)) {
      groups.set(key, {
        instrumentName: item.instrument?.name || 'Instrumento eliminado',
        teacherName: item.teacher?.name || 'Profesor eliminado',
        items: [],
      });
    }
    groups.get(key).items.push(item);
  }
  const rows = [...groups.values()]
    .map((g) => ({ ...g, dayRows: buildDayRows(g.items) }))
    .sort((a, b) => a.instrumentName.localeCompare(b.instrumentName) || a.teacherName.localeCompare(b.teacherName));

  return (
    <div>
      <h1>Clases fijas</h1>

      <div className="flex-row mb-16">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Instrumento</label>
          <select value={filterInstrument} onChange={(e) => setFilterInstrument(e.target.value)}>
            <option value="">Todos</option>
            {instruments.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Profesor</label>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
            <option value="">Todos</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Instrumento</th><th>Profesor</th><th>Días</th></tr></thead>
            <tbody>
              {rows.map((group, gi) => (
                <Fragment key={gi}>
                  <tr>
                    <td rowSpan={group.dayRows.length}>{group.instrumentName}</td>
                    <td rowSpan={group.dayRows.length}>{group.teacherName}</td>
                    <td
                      className={group.dayRows[0].primaryId === selectedId ? 'selected' : ''}
                      onClick={() => setSelectedId(group.dayRows[0].primaryId)}
                      style={{ cursor: 'pointer' }}
                    >
                      {group.dayRows[0].label}
                    </td>
                  </tr>
                  {group.dayRows.slice(1).map((dayRow, di) => (
                    <tr key={di}>
                      <td
                        className={dayRow.primaryId === selectedId ? 'selected' : ''}
                        onClick={() => setSelectedId(dayRow.primaryId)}
                        style={{ cursor: 'pointer' }}
                      >
                        {dayRow.label}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {rows.length === 0 && <tr><td colSpan="3">Sin registros.</td></tr>}
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
        <Modal title={mode === 'edit' ? 'Modificar clase' : 'Nueva clase'} onClose={close}>
          {error && <p className="error mb-3">{error}</p>}
          <ClassForm instruments={instruments} teachers={teachers} initial={mode === 'edit' ? selected : null} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}
