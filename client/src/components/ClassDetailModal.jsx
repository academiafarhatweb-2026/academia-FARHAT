import { useEffect, useState } from 'react';
import Modal from './Modal';
import Tabs from './Tabs';
import ClassForm from './ClassForm';
import ExpirationBadge from './ExpirationBadge';
import { classesApi, studentsApi, plansApi } from '../api/catalog';
import { enrollmentsApi } from '../api/enrollments';
import { useConfirm } from '../context/ConfirmContext';

export default function ClassDetailModal({ classItem, instruments, teachers, onClose, onChanged }) {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [addStudentId, setAddStudentId] = useState('');
  const [addPlanId, setAddPlanId] = useState('');
  const [error, setError] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    enrollmentsApi.list().then(setEnrollments);
    studentsApi.list().then(setStudents);
    plansApi.list().then(setPlans);
  }, [classItem._id]);

  const enrolledInClass = enrollments.filter(
    (e) => e.active !== false && e.classes?.some((c) => c._id === classItem._id)
  );
  const enrolledStudentIds = new Set(enrolledInClass.map((e) => e.student._id));
  const availableStudents = students.filter((s) => !enrolledStudentIds.has(s._id));

  async function handleUpdateClass(payload) {
    await classesApi.update(classItem._id, payload);
    onChanged();
    onClose();
  }

  async function handleDeleteClass() {
    const ok = await confirm({
      title: 'Eliminar clase',
      message: `Esto elimina "${classItem.instrument?.name || 'Instrumento eliminado'} - ${classItem.teacher?.name || 'Profesor eliminado'}" de este horario. Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await classesApi.remove(classItem._id);
    onChanged();
    onClose();
  }

  async function handleRemoveStudent(enrollment) {
    const ok = await confirm({
      title: 'Quitar alumno',
      message: `Esto quita a ${enrollment.student?.name || 'este alumno'} de esta clase. Continuar?`,
      confirmLabel: 'Quitar',
      danger: true,
    });
    if (!ok) return;
    const remainingClasses = enrollment.classes.filter((c) => c._id !== classItem._id).map((c) => c._id);
    if (remainingClasses.length === 0) {
      await enrollmentsApi.update(enrollment._id, { active: false });
    } else {
      await enrollmentsApi.update(enrollment._id, { classes: remainingClasses });
    }
    const refreshed = await enrollmentsApi.list();
    setEnrollments(refreshed);
    onChanged();
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setError('');
    if (!addStudentId || !addPlanId) return;
    try {
      await enrollmentsApi.create({
        student: addStudentId,
        plan: addPlanId,
        classes: [classItem._id],
        enrollmentDate: new Date().toISOString().slice(0, 10),
      });
      const refreshed = await enrollmentsApi.list();
      setEnrollments(refreshed);
      setAddStudentId('');
      setAddPlanId('');
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo inscribir al alumno');
    }
  }

  return (
    <Modal title={`${classItem.instrument?.name || 'Instrumento eliminado'} - ${classItem.teacher?.name || 'Profesor eliminado'}`} onClose={onClose}>
      <Tabs
        tabs={[
          {
            label: 'Info',
            content: (
              <div>
                <ClassForm
                  instruments={instruments}
                  teachers={teachers}
                  initial={classItem}
                  onSubmit={handleUpdateClass}
                />
                <button type="button" className="btn danger mt-16" onClick={handleDeleteClass}>
                  Eliminar clase
                </button>
              </div>
            ),
          },
          {
            label: 'Alumnos',
            content: (
              <div>
                <ul className="mb-4">
                  {enrolledInClass.map((e) => (
                    <li key={e._id} className="flex-row justify-between" style={{ marginBottom: 8 }}>
                      <div>
                        <div className="font-semibold text-ink">{e.student?.name || 'Alumno eliminado'}</div>
                        <div className="flex-row" style={{ marginTop: 2 }}>
                          <ExpirationBadge status={e.expirationStatus} />
                          <span className={e.paid ? 'badge badge-active' : 'badge badge-expired'}>
                            {e.paid ? 'Pagado' : 'No pagado'}
                          </span>
                          {e.nextDueDate && (
                            <span className="font-mono text-xs text-ink/60">
                              Vence: {new Date(e.nextDueDate).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button type="button" className="btn danger" onClick={() => handleRemoveStudent(e)}>
                        Quitar
                      </button>
                    </li>
                  ))}
                  {enrolledInClass.length === 0 && <li className="text-sm text-ink/60">Todavia no hay alumnos en esta clase.</li>}
                </ul>

                <form onSubmit={handleAddStudent} className="flex-row">
                  <select value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)}>
                    <option value="">Seleccione alumno</option>
                    {availableStudents.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <select value={addPlanId} onChange={(e) => setAddPlanId(e.target.value)}>
                    <option value="">Seleccione precio</option>
                    {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <button className="btn secondary" type="submit">+ Agregar alumno</button>
                </form>
                {error && <p className="error">{error}</p>}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
