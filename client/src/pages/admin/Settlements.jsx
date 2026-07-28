import { Fragment, useEffect, useState } from 'react';
import { teachersApi } from '../../api/catalog';
import { settlementsApi } from '../../api/settlements';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';

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
  const [generating, setGenerating] = useState(false);
  const [savingLine, setSavingLine] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);
  const [loadingViewId, setLoadingViewId] = useState(null);
  const [editingSettlement, setEditingSettlement] = useState(null);
  const [editSettlementForm, setEditSettlementForm] = useState({ teacherId: '', periodMonth: '', periodYear: '' });
  const [editSettlementError, setEditSettlementError] = useState('');
  const [savingSettlement, setSavingSettlement] = useState(false);
  const confirm = useConfirm();

  function reloadSettlements() {
    return settlementsApi.list().then((data) => {
      setSettlements(data);
      setLoadingSettlements(false);
    });
  }

  useEffect(() => {
    teachersApi.list().then(setTeachers);
    reloadSettlements();
  }, []);

  async function handleViewSettlement(id) {
    setLoadingViewId(id);
    try {
      const data = await settlementsApi.getOne(id);
      setSettlement(data);
      setError('');
    } finally {
      setLoadingViewId(null);
    }
  }

  function openEditSettlement(s) {
    setEditingSettlement(s);
    setEditSettlementError('');
    setEditSettlementForm({
      teacherId: s.teacher?._id || '',
      periodMonth: s.periodMonth,
      periodYear: s.periodYear,
    });
  }

  function closeEditSettlement() {
    setEditingSettlement(null);
    setEditSettlementForm({ teacherId: '', periodMonth: '', periodYear: '' });
  }

  async function handleSaveSettlement(e) {
    e.preventDefault();
    if (savingSettlement) return;
    setSavingSettlement(true);
    setEditSettlementError('');
    try {
      const data = await settlementsApi.update(editingSettlement._id, {
        teacherId: editSettlementForm.teacherId,
        periodMonth: Number(editSettlementForm.periodMonth),
        periodYear: Number(editSettlementForm.periodYear),
      });
      if (settlement?._id === data._id) setSettlement(data);
      closeEditSettlement();
      reloadSettlements();
    } catch (err) {
      setEditSettlementError(err.response?.data?.message || 'No se pudo modificar la liquidación');
    } finally {
      setSavingSettlement(false);
    }
  }

  async function handleDeleteSettlement(s) {
    const ok = await confirm({
      title: 'Eliminar liquidación',
      message: `Esto elimina para siempre la liquidación de ${s.teacher?.name || 'este profesor'} (${s.periodMonth}/${s.periodYear}). Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await settlementsApi.remove(s._id);
    if (settlement?._id === s._id) setSettlement(null);
    reloadSettlements();
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (generating) return;
    setError('');
    setSettlement(null);
    if (!teacherId) return;
    setGenerating(true);
    try {
      const data = await settlementsApi.generate({ teacherId, periodMonth: Number(periodMonth), periodYear: Number(periodYear) });
      setSettlement(data);
      reloadSettlements();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar la liquidación');
    } finally {
      setGenerating(false);
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
    if (savingLine) return;
    setSavingLine(true);
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

    try {
      const data = await settlementsApi.update(settlement._id, { lines: updatedLines });
      setSettlement(data);
      closeEditLine();
      reloadSettlements();
    } finally {
      setSavingLine(false);
    }
  }

  const groups = settlement ? groupByInstrument(settlement.lines) : [];
  const liveTotal =
    lineForm && lineForm.pricePerClass !== '' && lineForm.classesCount !== ''
      ? Number(lineForm.pricePerClass) * Number(lineForm.classesCount)
      : 0;

  return (
    <div>
      <h1>Liquidación de profesores</h1>

      <form className="card-form no-print" onSubmit={handleGenerate}>
        <div className="field">
          <label htmlFor="settlementTeacher">Profesor</label>
          <select id="settlementTeacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
            <option value="">Seleccione profesor</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex-row">
          <div className="field">
            <label htmlFor="settlementMonth">Mes</label>
            <input id="settlementMonth" type="number" min="1" max="12" step="1" required value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="settlementYear">Año</label>
            <input id="settlementYear" type="number" min="2000" max="2100" step="1" required value={periodYear} onChange={(e) => setPeriodYear(e.target.value)} />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={generating}>
          {generating ? 'Generando...' : 'Generar liquidación'}
        </button>
      </form>

      {settlement && (
        <>
          <p className="mb-4 text-sm text-ink/60 no-print">
            Se genera automático según los pagos reales, pero podés tocar una fila y modificarla si el monto no coincide.
          </p>
          <div className="mb-4 flex items-center justify-between">
            <p className="mb-0 font-semibold">
              {settlement.teacher?.name} — {settlement.periodMonth}/{settlement.periodYear}
            </p>
            <button type="button" className="btn no-print" onClick={() => window.print()}>Guardar PDF</button>
          </div>
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
                  <th className="no-print"></th>
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
                          <td className="no-print">
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

      <h2 className="no-print mt-16">Historial de liquidaciones</h2>
      <p className="no-print mb-4 text-sm text-ink/60">Todas las liquidaciones generadas, con las más recientes primero.</p>

      {loadingSettlements ? (
        <p className="no-print">Cargando...</p>
      ) : (
        <div className="table-wrap no-print">
          <table>
            <thead>
              <tr>
                <th>Profesor</th>
                <th>Periodo</th>
                <th>Total</th>
                <th>Generado el</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s._id}>
                  <td>{s.teacher.name}</td>
                  <td>{s.periodMonth}/{s.periodYear}</td>
                  <td>${s.totalAmount}</td>
                  <td>{new Date(s.generatedAt).toLocaleDateString('es-AR')}</td>
                  <td className="flex-row">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => handleViewSettlement(s._id)}
                      disabled={loadingViewId === s._id}
                    >
                      {loadingViewId === s._id ? 'Cargando...' : 'Ver / Guardar PDF'}
                    </button>
                    <button type="button" className="btn secondary" onClick={() => openEditSettlement(s)}>Modificar</button>
                    <button type="button" className="btn danger" onClick={() => handleDeleteSettlement(s)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && <tr><td colSpan="5">Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editingIndex !== null && lineForm && (
        <Modal title="Modificar línea de liquidación" onClose={closeEditLine}>
          <form onSubmit={handleSaveLine}>
            <div className="field">
              <label htmlFor="lineValue">Valor</label>
              <input id="lineValue" type="number" min="0" step="0.01" required value={lineForm.value} onChange={(e) => setLineField('value', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="linePercentage">%</label>
              <input id="linePercentage" type="number" min="0" max="100" step="0.01" required value={lineForm.percentage} onChange={(e) => setLineField('percentage', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="linePrice">Precio por clase</label>
              <input id="linePrice" type="number" min="0" step="0.01" required value={lineForm.pricePerClass} onChange={(e) => setLineField('pricePerClass', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lineClasses">Clases</label>
              <input id="lineClasses" type="number" min="0" step="1" required value={lineForm.classesCount} onChange={(e) => setLineField('classesCount', e.target.value)} />
            </div>
            <p className="mb-4 text-sm text-ink/60">
              Total: <strong className="text-ink">${liveTotal}</strong>
            </p>
            <button className="btn" type="submit" disabled={savingLine}>
              {savingLine ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {editingSettlement && (
        <Modal title="Modificar liquidación" onClose={closeEditSettlement}>
          <form onSubmit={handleSaveSettlement}>
            <div className="field">
              <label htmlFor="editSettlementTeacher">Profesor</label>
              <select
                id="editSettlementTeacher"
                value={editSettlementForm.teacherId}
                onChange={(e) => setEditSettlementForm((f) => ({ ...f, teacherId: e.target.value }))}
                required
              >
                <option value="">Seleccione profesor</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex-row">
              <div className="field">
                <label htmlFor="editSettlementMonth">Mes</label>
                <input
                  id="editSettlementMonth"
                  type="number"
                  min="1"
                  max="12"
                  step="1"
                  required
                  value={editSettlementForm.periodMonth}
                  onChange={(e) => setEditSettlementForm((f) => ({ ...f, periodMonth: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="editSettlementYear">Año</label>
                <input
                  id="editSettlementYear"
                  type="number"
                  min="2000"
                  max="2100"
                  step="1"
                  required
                  value={editSettlementForm.periodYear}
                  onChange={(e) => setEditSettlementForm((f) => ({ ...f, periodYear: e.target.value }))}
                />
              </div>
            </div>
            <p className="mb-4 text-xs text-ink/60">
              Las clases y montos se vuelven a calcular para el profesor y periodo elegidos.
            </p>
            {editSettlementError && <p className="error mb-3">{editSettlementError}</p>}
            <button className="btn" type="submit" disabled={savingSettlement}>
              {savingSettlement ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
