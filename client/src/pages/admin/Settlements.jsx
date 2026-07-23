import { Fragment, useEffect, useState } from 'react';
import { teachersApi } from '../../api/catalog';
import { settlementsApi } from '../../api/settlements';
import Modal from '../../components/Modal';

const now = new Date();

function groupByInstrument(lines) {
  const groups = new Map();
  lines.forEach((line, index) => {
    const key = line.instrument?.name || 'Sin instrumento';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...line, index });
  });
  return [...groups.entries()];
}

function toRefId(value) {
  return typeof value === 'object' && value !== null ? value._id : value;
}

export default function Settlements() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [settlement, setSettlement] = useState(null);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [lineForm, setLineForm] = useState(null);

  useEffect(() => {
    teachersApi.list().then(setTeachers);
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    setSettlement(null);
    if (!teacherId) return;
    try {
      const data = await settlementsApi.generate({ teacherId, periodMonth: Number(periodMonth), periodYear: Number(periodYear) });
      setSettlement(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar la liquidacion');
    }
  }

  function openEditLine(index) {
    const line = settlement.lines[index];
    setEditingIndex(index);
    setLineForm({
      value: line.value,
      percentage: line.percentage,
      pricePerClass: line.pricePerClass,
      classesCount: line.classesCount,
    });
  }

  function closeEditLine() {
    setEditingIndex(null);
    setLineForm(null);
  }

  function setLineField(field, raw) {
    const value = raw === '' ? '' : Number(raw);
    setLineForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSaveLine(e) {
    e.preventDefault();
    const updatedLines = settlement.lines.map((line, i) => {
      if (i !== editingIndex) {
        return {
          ...line,
          enrollment: toRefId(line.enrollment),
          student: toRefId(line.student),
          instrument: toRefId(line.instrument),
          plan: toRefId(line.plan),
        };
      }
      return {
        ...line,
        enrollment: toRefId(line.enrollment),
        student: toRefId(line.student),
        instrument: toRefId(line.instrument),
        plan: toRefId(line.plan),
        value: Number(lineForm.value) || 0,
        percentage: Number(lineForm.percentage) || 0,
        pricePerClass: Number(lineForm.pricePerClass) || 0,
        classesCount: Number(lineForm.classesCount) || 0,
      };
    });

    const data = await settlementsApi.update(settlement._id, { lines: updatedLines });
    setSettlement(data);
    closeEditLine();
  }

  const groups = settlement ? groupByInstrument(settlement.lines) : [];
  const liveTotal =
    lineForm && lineForm.pricePerClass !== '' && lineForm.classesCount !== ''
      ? Number(lineForm.pricePerClass) * Number(lineForm.classesCount)
      : 0;

  return (
    <div>
      <h1>Liquidacion de profesores</h1>

      <form className="card-form" onSubmit={handleGenerate}>
        <div className="field">
          <label htmlFor="settlementTeacher">Profesor</label>
          <select id="settlementTeacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Seleccione profesor</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex-row">
          <div className="field">
            <label htmlFor="settlementMonth">Mes</label>
            <input id="settlementMonth" type="number" min="1" max="12" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="settlementYear">Ano</label>
            <input id="settlementYear" type="number" value={periodYear} onChange={(e) => setPeriodYear(e.target.value)} />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">Generar liquidacion</button>
      </form>

      {settlement && (
        <>
          <p className="mb-4 text-sm text-ink/60">
            Se genera automatico segun los pagos reales, pero podes tocar una fila y modificarla si el monto no coincide.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Promo</th>
                  <th>Valor</th>
                  <th>%</th>
                  <th>Precio</th>
                  <th>Clases</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map(([instrumentName, lines]) => {
                  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
                  return (
                    <Fragment key={instrumentName}>
                      <tr>
                        <td colSpan="8"><strong>{instrumentName.toUpperCase()} ALUMNOS</strong></td>
                      </tr>
                      {lines.map((line) => (
                        <tr key={line.index}>
                          <td>{line.student?.name}</td>
                          <td>{line.plan?.name}</td>
                          <td>${line.value}</td>
                          <td>{line.percentage}%</td>
                          <td>${line.pricePerClass}</td>
                          <td>{line.classesCount}</td>
                          <td>${line.total}</td>
                          <td>
                            <button type="button" className="btn secondary" onClick={() => openEditLine(line.index)}>
                              Modificar
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="6">Subtotal {instrumentName}</td>
                        <td colSpan="2">${subtotal}</td>
                      </tr>
                    </Fragment>
                  );
                })}
                {groups.length === 0 && <tr><td colSpan="8">Sin clases liquidables en este periodo.</td></tr>}
                <tr>
                  <td colSpan="6"><strong>Total a liquidar</strong></td>
                  <td colSpan="2"><strong>${settlement.totalAmount}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingIndex !== null && lineForm && (
        <Modal title="Modificar linea de liquidacion" onClose={closeEditLine}>
          <form onSubmit={handleSaveLine}>
            <div className="field">
              <label htmlFor="lineValue">Valor</label>
              <input id="lineValue" type="number" value={lineForm.value} onChange={(e) => setLineField('value', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="linePercentage">%</label>
              <input id="linePercentage" type="number" value={lineForm.percentage} onChange={(e) => setLineField('percentage', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="linePrice">Precio por clase</label>
              <input id="linePrice" type="number" value={lineForm.pricePerClass} onChange={(e) => setLineField('pricePerClass', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lineClasses">Clases</label>
              <input id="lineClasses" type="number" value={lineForm.classesCount} onChange={(e) => setLineField('classesCount', e.target.value)} />
            </div>
            <p className="mb-4 text-sm text-ink/60">
              Total: <strong className="text-ink">${liveTotal}</strong>
            </p>
            <button className="btn" type="submit">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
