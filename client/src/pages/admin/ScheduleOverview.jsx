import { useEffect, useState } from 'react';
import { classesApi, instrumentsApi, teachersApi } from '../../api/catalog';
import WeeklyCalendar from '../../components/WeeklyCalendar';
import ClassDetailModal from '../../components/ClassDetailModal';

export default function ScheduleOverview() {
  const [classes, setClasses] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  function reload() {
    return classesApi.list().then(setClasses);
  }

  useEffect(() => {
    Promise.all([reload(), instrumentsApi.list().then(setInstruments), teachersApi.list().then(setTeachers)]).then(
      () => setLoading(false)
    );
  }, []);

  async function handleChanged() {
    const refreshed = await classesApi.list();
    setClasses(refreshed);
    if (selectedClass) {
      const updated = refreshed.find((c) => c._id === selectedClass._id);
      setSelectedClass(updated || null);
    }
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Horario general</h1>
      <p className="mb-4 text-sm text-ink/60">Toca una clase para ver el detalle, editarla o gestionar sus alumnos.</p>

      <WeeklyCalendar classes={classes} onSelect={setSelectedClass} />

      {selectedClass && (
        <ClassDetailModal
          classItem={selectedClass}
          instruments={instruments}
          teachers={teachers}
          onClose={() => setSelectedClass(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
