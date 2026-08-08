import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DAYS } from '../utils/days';
import { classFormSchema } from '../schemas';

const emptyValues = { instrument: '', teacher: '', slots: [] };

function toFormValue(fixedClass) {
  if (!fixedClass) return emptyValues;
  return {
    // A class can reference a teacher/instrument that was since deleted —
    // fall back to empty so the admin has to pick a valid one to save again.
    instrument: fixedClass.instrument?._id || '',
    teacher: fixedClass.teacher?._id || '',
    slots: fixedClass.slots.map((s) => ({ day: String(s.day), startHour: String(s.startHour), endHour: String(s.endHour) })),
  };
}

export default function ClassForm({ instruments, teachers, initial, onSubmit, submitLabel = 'Guardar' }) {
  const [submitting, setSubmitting] = useState(false);
  // Callers (Classes.jsx via useCrudModal, ClassDetailModal directly) don't all
  // provide their own re-entrancy guard, so this form locks itself against a
  // double-click/double-submit firing onSubmit twice.
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(classFormSchema), defaultValues: toFormValue(initial) });
  const { fields, append, remove } = useFieldArray({ control, name: 'slots' });

  useEffect(() => {
    reset(toFormValue(initial));
  }, [initial, reset]);

  function addSlot() {
    append({ day: '1', startHour: '17', endHour: '19' });
  }

  async function onValid(data) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit({
        instrument: data.instrument,
        teacher: data.teacher,
        slots: data.slots.map((s) => ({ day: Number(s.day), startHour: Number(s.startHour), endHour: Number(s.endHour) })),
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="field">
        <label htmlFor="classInstrument">Instrumento</label>
        <select id="classInstrument" {...register('instrument')}>
          <option value="">Seleccione instrumento</option>
          {instruments.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
        {errors.instrument && <p className="error">{errors.instrument.message}</p>}
      </div>
      <div className="field">
        <label htmlFor="classTeacher">Profesor</label>
        <select id="classTeacher" {...register('teacher')}>
          <option value="">Seleccione profesor</option>
          {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        {errors.teacher && <p className="error">{errors.teacher.message}</p>}
      </div>
      <div className="field">
        <label>Horarios</label>
        {fields.map((field, i) => (
          <div key={field.id}>
            <div className="flex-row" style={{ marginBottom: 6 }}>
              <select {...register(`slots.${i}.day`)}>
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <input type="number" min="0" max="23" style={{ width: 70 }} {...register(`slots.${i}.startHour`)} />
              <span>a</span>
              <input type="number" min="0" max="23" style={{ width: 70 }} {...register(`slots.${i}.endHour`)} />
              <button type="button" className="btn danger" onClick={() => remove(i)}>Quitar</button>
            </div>
            {(errors.slots?.[i]?.startHour || errors.slots?.[i]?.endHour) && (
              <p className="error">{errors.slots[i].startHour?.message || errors.slots[i].endHour?.message}</p>
            )}
          </div>
        ))}
        {errors.slots?.message && <p className="error">{errors.slots.message}</p>}
        <button type="button" className="btn secondary" onClick={addSlot}>+ Agregar horario</button>
      </div>

      <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Guardando...' : submitLabel}</button>
    </form>
  );
}
