import { useEffect, useState } from 'react';
import { studentsApi, classesApi, plansApi } from '../../api/catalog';
import { enrollmentsApi } from '../../api/enrollments';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import ExpirationBadge from '../../components/ExpirationBadge';
import { dayLabel } from '../../utils/days';
import { useConfirm } from '../../context/ConfirmContext';

const emptyForm = { student: '', plan: '', customValue: '', classes: [], enrollmentDate: new Date().toISOString().slice(0, 10) };

function classScheduleLine(cls) {
  return cls.slots.map((s) => `${dayLabel(s.day)} ${s.startHour}-${s.endHour}hs`).join(', ');
}

function toFormValue(enrollment) {
  if (!enrollment) return emptyForm;
  return {
    // The student/plan can end up null if that record was deleted after this
    // enrollment was created — fall back so editing doesn't crash outright.
    student: enrollment.student?._id || '',
    plan: enrollment.plan?._id || '',
    customValue: enrollment.customValue ?? enrollment.plan?.value ?? '',
    classes: enrollment.classes.map((c) => c._id),
    enrollmentDate: enrollment.enrollmentDate.slice(0, 10),
  };
}

export default function Enrollments() {
  const {
    items,
    loading,
    selectedId,
    setSelectedId,
    selected,
    mode,
    error,
    openCreate,
    openEdit,
    close,
    submit,
    update,
    reload,
  } = useCrudModal(enrollmentsApi);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedClass, setSelectedClass] = useState('');
  const [formError, setFormError] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    studentsApi.list().then(setStudents);
    classesApi.list().then(setClasses);
    plansApi.list().then(setPlans);
  }, []);

  useEffect(() => {
    if (mode === 'edit' && selected) {
      setForm(toFormValue(selected));
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
    setSelectedClass('');
    setFormError('');
  }, [mode, selected]);

  function classLabel(cls) {
    const instrumentName = cls.instrument?.name || 'Instrumento eliminado';
    const teacherName = cls.teacher?.name || 'Profesor eliminado';
    return `${instrumentName} - ${teacherName} - ${cls.slots.map((s) => `${dayLabel(s.day)} ${s.startHour}-${s.endHour}`).join(', ')}`;
  }

  function addClass() {
    if (!selectedClass || form.classes.includes(selectedClass)) return;
    setForm((f) => ({ ...f, classes: [...f.classes, selectedClass] }));
    setSelectedClass('');
  }

  function removeClass(id) {
    setForm((f) => ({ ...f, classes: f.classes.filter((c) => c !== id) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    // If the admin picked a class but forgot to click "+ Agregar", include it anyway.
    const classes = form.classes.includes(selectedClass) || !selectedClass
      ? form.classes
      : [...form.classes, selectedClass];

    if (!form.student) return setFormError('Elegi un alumno.');
    if (!form.plan) return setFormError('Elegi un precio.');
    if (classes.length === 0) return setFormError('Agrega al menos una clase (tocando "+ Agregar").');

    submit({ ...form, classes, customValue: Number(form.customValue) });
  }

  async function handleHardDelete() {
    if (!selected) return;
    const ok = await confirm({
      title: 'Eliminar inscripcion',
      message: `Esto elimina para siempre la inscripcion de ${selected.student?.name}, sin poder deshacerlo. Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await enrollmentsApi.hardRemove(selectedId);
    setSelectedId(null);
    reload();
  }

  return (
    <div>
      <h1>Inscripciones</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Alumno</th><th>Precio</th><th>Clases</th><th>Vencimiento</th><th>Inscripcion</th><th></th></tr></thead>
            <tbody>
              {items.map((e) => (
                <tr key={e._id} className={e._id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(e._id)} style={{ cursor: 'pointer' }}>
                  <td>{e.student?.name}</td>
                  <td>
                    {e.plan?.name}
                    {e.plan?.classesIncluded && (
                      <div className="font-mono text-xs text-ink/60">{e.plan.classesIncluded} clases</div>
                    )}
                  </td>
                  <td>
                    {e.classes?.map((c) => (
                      <div key={c._id} style={{ marginBottom: 6 }}>
                        <div className="text-xs font-semibold text-ink">{c.instrument?.name}</div>
                        {c.teacher?.name && <div className="text-xs text-ink/60">Prof. {c.teacher.name}</div>}
                        <div className="font-mono text-xs text-ink/60">{classScheduleLine(c)}</div>
                      </div>
                    ))}
                  </td>
                  <td><ExpirationBadge status={e.expirationStatus} /></td>
                  <td>
                    <span className={e.active ? 'badge badge-active' : 'badge badge-neutral'}>
                      {e.active ? 'Activa' : 'De baja'}
                    </span>
                  </td>
                  <td className="flex-row" onClick={(ev) => ev.stopPropagation()}>
                    <button className="btn danger" onClick={() => update(e._id, { active: !e.active })}>
                      {e.active ? 'Dar de baja' : 'Dar de alta'}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="6">Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex-row mt-16">
        <button className="btn" onClick={openCreate}>Nueva inscripcion</button>
        <button className="btn secondary" onClick={openEdit} disabled={!selectedId}>Modificar</button>
        <button className="btn danger" onClick={handleHardDelete} disabled={!selectedId}>Eliminar definitivamente</button>
      </div>

      {mode && (
        <Modal title={mode === 'edit' ? 'Modificar inscripcion' : 'Nueva inscripcion'} onClose={close}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="enrollStudent">Alumno</label>
              <select
                id="enrollStudent"
                value={form.student}
                disabled={mode === 'edit'}
                onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))}
              >
                <option value="">Seleccione un alumno</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="enrollPlan">Cantidad de clases</label>
              <select
                id="enrollPlan"
                value={form.plan}
                onChange={(e) => {
                  const planId = e.target.value;
                  const chosenPlan = plans.find((p) => p._id === planId);
                  setForm((f) => ({ ...f, plan: planId, customValue: chosenPlan ? chosenPlan.value : f.customValue }));
                }}
              >
                <option value="">Seleccione cantidad de clases</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name} - {p.classesIncluded} clases</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="enrollCustomValue">Precio</label>
              <input
                id="enrollCustomValue"
                type="number"
                value={form.customValue}
                onChange={(e) => setForm((f) => ({ ...f, customValue: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="enrollDate">Fecha de inscripcion</label>
              <input id="enrollDate" type="date" value={form.enrollmentDate} onChange={(e) => setForm((f) => ({ ...f, enrollmentDate: e.target.value }))} />
            </div>

            <div className="field">
              <label>Clases</label>
              <div className="flex-row">
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">Seleccione clase</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{classLabel(c)}</option>)}
                </select>
                <button type="button" className="btn secondary" onClick={addClass}>+ Agregar</button>
              </div>
              <ul>
                {form.classes.map((id) => {
                  const cls = classes.find((c) => c._id === id);
                  return (
                    <li key={id} className="flex-row">
                      {cls ? classLabel(cls) : id}
                      <button type="button" className="btn danger" onClick={() => removeClass(id)}>Quitar</button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {(formError || error) && <p className="error mb-3">{formError || error}</p>}
            <button className="btn" type="submit">{mode === 'edit' ? 'Guardar' : 'Inscribir'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
