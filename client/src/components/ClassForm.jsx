import { useEffect, useRef, useState } from 'react';
import { DAYS } from '../utils/days';

const emptyForm = { instrument: '', teacher: '', slots: [] };

function toFormValue(fixedClass) {
  if (!fixedClass) return emptyForm;
  return {
    // A class can reference a teacher/instrument that was since deleted —
    // fall back to empty so the admin has to pick a valid one to save again.
    instrument: fixedClass.instrument?._id || '',
    teacher: fixedClass.teacher?._id || '',
    slots: fixedClass.slots,
  };
}

export default function ClassForm({ instruments, teachers, initial, onSubmit, submitLabel = 'Guardar' }) {
  const [form, setForm] = useState(() => toFormValue(initial));
  const [submitting, setSubmitting] = useState(false);
  // Callers (Classes.jsx via useCrudModal, ClassDetailModal directly) don't all
  // provide their own re-entrancy guard, so this form locks itself against a
  // double-click/double-submit firing onSubmit twice.
  const submittingRef = useRef(false);

  useEffect(() => {
    setForm(toFormValue(initial));
  }, [initial]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addSlot() {
    setForm((f) => ({ ...f, slots: [...f.slots, { day: 1, startHour: 17, endHour: 19 }] }));
  }

  function updateSlot(index, field, value) {
    setForm((f) => ({ ...f, slots: f.slots.map((s, i) => (i === index ? { ...s, [field]: Number(value) } : s)) }));
  }

  function removeSlot(index) {
    setForm((f) => ({ ...f, slots: f.slots.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.instrument || !form.teacher || form.slots.length === 0) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="classInstrument">Instrumento</label>
        <select id="classInstrument" value={form.instrument} onChange={(e) => setField('instrument', e.target.value)} required>
          <option value="">Seleccione instrumento</option>
          {instruments.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="classTeacher">Profesor</label>
        <select id="classTeacher" value={form.teacher} onChange={(e) => setField('teacher', e.target.value)} required>
          <option value="">Seleccione profesor</option>
          {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Horarios</label>
        {form.slots.map((slot, i) => (
          <div key={i} className="flex-row" style={{ marginBottom: 6 }}>
            <select value={slot.day} onChange={(e) => updateSlot(i, 'day', e.target.value)}>
              {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input type="number" min="0" max="23" required style={{ width: 70 }} value={slot.startHour} onChange={(e) => updateSlot(i, 'startHour', e.target.value)} />
            <span>a</span>
            <input type="number" min="0" max="23" required style={{ width: 70 }} value={slot.endHour} onChange={(e) => updateSlot(i, 'endHour', e.target.value)} />
            <button type="button" className="btn danger" onClick={() => removeSlot(i)}>Quitar</button>
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={addSlot}>+ Agregar horario</button>
      </div>

      <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Guardando...' : submitLabel}</button>
    </form>
  );
}
