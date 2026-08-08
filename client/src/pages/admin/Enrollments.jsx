import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentsApi, classesApi, plansApi } from '../../api/catalog';
import { enrollmentsApi } from '../../api/enrollments';
import { useCrudModal } from '../../hooks/useCrudModal';
import Modal from '../../components/Modal';
import ExpirationBadge from '../../components/ExpirationBadge';
import { dayLabel } from '../../utils/days';
import { useConfirm } from '../../context/ConfirmContext';
import { enrollmentSchema } from '../../schemas';

const emptyValues = { student: '', plan: '', customValue: '', classes: [], enrollmentDate: new Date().toISOString().slice(0, 10) };

function classScheduleLine(cls) {
  return cls.slots.map((s) => `${dayLabel(s.day)} ${s.startHour}-${s.endHour}hs`).join(', ');
}

function toFormValue(enrollment) {
  if (!enrollment) return emptyValues;
  return {
    // The student/plan can end up null if that record was deleted after this
    // enrollment was created — fall back so editing doesn't crash outright.
    student: enrollment.student?._id || '',
    plan: enrollment.plan?._id || '',
    customValue: String(enrollment.customValue ?? enrollment.plan?.value ?? ''),
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
    submitting,
  } = useCrudModal(enrollmentsApi);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(enrollmentSchema), defaultValues: emptyValues });
  const formClasses = watch('classes');

  useEffect(() => {
    studentsApi.list().then(setStudents);
    classesApi.list().then(setClasses);
    plansApi.list().then(setPlans);
  }, []);

  useEffect(() => {
    if (mode === 'edit' && selected) {
      reset(toFormValue(selected));
    } else if (mode === 'create') {
      reset(emptyValues);
    }
    setSelectedClass('');
  }, [mode, selected, reset]);

  function classLabel(cls) {
    const instrumentName = cls.instrument?.name || 'Instrumento eliminado';
    const teacherName = cls.teacher?.name || 'Profesor eliminado';
    return `${instrumentName} - ${teacherName} - ${cls.slots.map((s) => `${dayLabel(s.day)} ${s.startHour}-${s.endHour}`).join(', ')}`;
  }

  function addClass() {
    if (!selectedClass || formClasses.includes(selectedClass)) return;
    setValue('classes', [...formClasses, selectedClass], { shouldValidate: true });
    setSelectedClass('');
  }

  function removeClass(id) {
    setValue(
      'classes',
      formClasses.filter((c) => c !== id),
      { shouldValidate: true }
    );
  }

  function handlePlanChange(e) {
    const planId = e.target.value;
    const chosenPlan = plans.find((p) => p._id === planId);
    if (chosenPlan) setValue('customValue', String(chosenPlan.value), { shouldValidate: true });
  }

  function onValid(data) {
    // If the admin picked a class but forgot to click "+ Agregar", include it anyway.
    const classesToSubmit =
      data.classes.includes(selectedClass) || !selectedClass ? data.classes : [...data.classes, selectedClass];
    submit({ ...data, classes: classesToSubmit, customValue: Number(data.customValue) });
  }

  async function handleHardDelete() {
    if (!selected) return;
    const ok = await confirm({
      title: 'Eliminar inscripción',
      message: `Esto elimina para siempre la inscripción de ${selected.student?.name}, sin poder deshacerlo. Continuar?`,
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
            <thead><tr><th>Alumno</th><th>Precio</th><th>Clases</th><th>Vencimiento</th><th>Inscripción</th><th></th></tr></thead>
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
        <button className="btn" onClick={openCreate}>Nueva inscripción</button>
        <button className="btn secondary" onClick={openEdit} disabled={!selectedId}>Modificar</button>
        <button className="btn danger" onClick={handleHardDelete} disabled={!selectedId}>Eliminar definitivamente</button>
      </div>

      {mode && (
        <Modal title={mode === 'edit' ? 'Modificar inscripción' : 'Nueva inscripción'} onClose={close}>
          <form onSubmit={handleSubmit(onValid)} noValidate>
            <div className="field">
              <label htmlFor="enrollStudent">Alumno</label>
              <select id="enrollStudent" disabled={mode === 'edit'} {...register('student')}>
                <option value="">Seleccione un alumno</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {errors.student && <p className="error">{errors.student.message}</p>}
            </div>

            <div className="field">
              <label htmlFor="enrollPlan">Cantidad de clases</label>
              <select id="enrollPlan" {...register('plan', { onChange: handlePlanChange })}>
                <option value="">Seleccione cantidad de clases</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name} - {p.classesIncluded} clases</option>)}
              </select>
              {errors.plan && <p className="error">{errors.plan.message}</p>}
            </div>

            <div className="field">
              <label htmlFor="enrollCustomValue">Precio</label>
              <input id="enrollCustomValue" type="number" step="0.01" {...register('customValue')} />
              {errors.customValue && <p className="error">{errors.customValue.message}</p>}
            </div>

            <div className="field">
              <label htmlFor="enrollDate">Fecha de inscripción</label>
              <input id="enrollDate" type="date" {...register('enrollmentDate')} />
              {errors.enrollmentDate && <p className="error">{errors.enrollmentDate.message}</p>}
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
                {formClasses.map((id) => {
                  const cls = classes.find((c) => c._id === id);
                  return (
                    <li key={id} className="flex-row">
                      {cls ? classLabel(cls) : id}
                      <button type="button" className="btn danger" onClick={() => removeClass(id)}>Quitar</button>
                    </li>
                  );
                })}
              </ul>
              {errors.classes && <p className="error">{errors.classes.message}</p>}
            </div>

            {error && <p className="error mb-3">{error}</p>}
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Inscribir'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
