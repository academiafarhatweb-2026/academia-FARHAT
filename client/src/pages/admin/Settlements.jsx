import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teachersApi } from '../../api/catalog';
import { settlementsApi } from '../../api/settlements';
import Modal from '../../components/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { settlementGenerateSchema, settlementLineEditSchema, settlementIdentityEditSchema } from '../../schemas';

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
  const [settlement, setSettlement] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [savingLine, setSavingLine] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);
  const [loadingViewId, setLoadingViewId] = useState(null);
  const [editingSettlement, setEditingSettlement] = useState(null);
  const [savingSettlement, setSavingSettlement] = useState(false);
  const confirm = useConfirm();

  const {
    register: registerGenerate,
    handleSubmit: handleSubmitGenerate,
    setError: setGenerateError,
    formState: { errors: generateErrors },
  } = useForm({
    resolver: zodResolver(settlementGenerateSchema),
    defaultValues: { teacherId: '', periodMonth: String(now.getMonth() + 1), periodYear: String(now.getFullYear()) },
  });

  const {
    register: registerLine,
    handleSubmit: handleSubmitLine,
    reset: resetLine,
    watch: watchLine,
    formState: { errors: lineErrors },
  } = useForm({ resolver: zodResolver(settlementLineEditSchema), defaultValues: { value: '', percentage: '', pricePerClass: '', classesCount: '' } });
  const linePricePerClass = watchLine('pricePerClass');
  const lineClassesCount = watchLine('classesCount');

  const {
    register: registerSettlement,
    handleSubmit: handleSubmitSettlement,
    reset: resetSettlement,
    setError: setSettlementError,
    formState: { errors: settlementErrors },
  } = useForm({ resolver: zodResolver(settlementIdentityEditSchema), defaultValues: { teacherId: '', periodMonth: '', periodYear: '' } });

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
    } finally {
      setLoadingViewId(null);
    }
  }

  function openEditSettlement(s) {
    setEditingSettlement(s);
    resetSettlement({
      teacherId: s.teacher?._id || '',
      periodMonth: String(s.periodMonth),
      periodYear: String(s.periodYear),
    });
  }

  function closeEditSettlement() {
    setEditingSettlement(null);
  }

  async function onValidSettlement(data) {
    if (savingSettlement) return;
    setSavingSettlement(true);
    try {
      const updated = await settlementsApi.update(editingSettlement._id, {
        teacherId: data.teacherId,
        periodMonth: Number(data.periodMonth),
        periodYear: Number(data.periodYear),
      });
      if (settlement?._id === updated._id) setSettlement(updated);
      closeEditSettlement();
      reloadSettlements();
    } catch (err) {
      setSettlementError('root', { message: err.response?.data?.message || 'No se pudo modificar la liquidación' });
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

  async function onValidGenerate(data) {
    if (generating) return;
    setSettlement(null);
    setGenerating(true);
    try {
      const result = await settlementsApi.generate({
        teacherId: data.teacherId,
        periodMonth: Number(data.periodMonth),
        periodYear: Number(data.periodYear),
      });
      setSettlement(result);
      reloadSettlements();
    } catch (err) {
      setGenerateError('root', { message: err.response?.data?.message || 'No se pudo generar la liquidación' });
    } finally {
      setGenerating(false);
    }
  }

  function openEditLine(index) {
    const line = settlement.lines[index];
    setEditingIndex(index);
    resetLine({
      value: String(line.value),
      percentage: String(line.percentage),
      pricePerClass: String(line.pricePerClass),
      classesCount: String(line.classesCount),
    });
  }

  function closeEditLine() {
    setEditingIndex(null);
  }

  async function onValidLine(data) {
    if (savingLine) return;
    setSavingLine(true);
    const updatedLines = settlement.lines.map((line, i) => {
      const base = {
        ...line,
        enrollment: toRefId(line.enrollment),
        student: toRefId(line.student),
        instrument: toRefId(line.instrument),
        plan: toRefId(line.plan),
      };
      if (i !== editingIndex) return base;
      return {
        ...base,
        value: Number(data.value),
        percentage: Number(data.percentage),
        pricePerClass: Number(data.pricePerClass),
        classesCount: Number(data.classesCount),
      };
    });

    try {
      const updated = await settlementsApi.update(settlement._id, { lines: updatedLines });
      setSettlement(updated);
      closeEditLine();
      reloadSettlements();
    } finally {
      setSavingLine(false);
    }
  }

  const groups = settlement ? groupByInstrument(settlement.lines) : [];
  const liveTotal =
    linePricePerClass && lineClassesCount && !isNaN(Number(linePricePerClass)) && !isNaN(Number(lineClassesCount))
      ? Number(linePricePerClass) * Number(lineClassesCount)
      : 0;

  return (
    <div>
      <h1>Liquidación de profesores</h1>

      <form className="card-form no-print" onSubmit={handleSubmitGenerate(onValidGenerate)} noValidate>
        <div className="field">
          <label htmlFor="settlementTeacher">Profesor</label>
          <select id="settlementTeacher" {...registerGenerate('teacherId')}>
            <option value="">Seleccione profesor</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          {generateErrors.teacherId && <p className="error">{generateErrors.teacherId.message}</p>}
        </div>
        <div className="flex-row">
          <div className="field">
            <label htmlFor="settlementMonth">Mes</label>
            <input id="settlementMonth" type="number" step="1" {...registerGenerate('periodMonth')} />
            {generateErrors.periodMonth && <p className="error">{generateErrors.periodMonth.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="settlementYear">Año</label>
            <input id="settlementYear" type="number" step="1" {...registerGenerate('periodYear')} />
            {generateErrors.periodYear && <p className="error">{generateErrors.periodYear.message}</p>}
          </div>
        </div>
        {generateErrors.root && <p className="error">{generateErrors.root.message}</p>}
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

      {editingIndex !== null && (
        <Modal title="Modificar línea de liquidación" onClose={closeEditLine}>
          <form onSubmit={handleSubmitLine(onValidLine)} noValidate>
            <div className="field">
              <label htmlFor="lineValue">Valor</label>
              <input id="lineValue" type="number" step="0.01" {...registerLine('value')} />
              {lineErrors.value && <p className="error">{lineErrors.value.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="linePercentage">%</label>
              <input id="linePercentage" type="number" step="0.01" {...registerLine('percentage')} />
              {lineErrors.percentage && <p className="error">{lineErrors.percentage.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="linePrice">Precio por clase</label>
              <input id="linePrice" type="number" step="0.01" {...registerLine('pricePerClass')} />
              {lineErrors.pricePerClass && <p className="error">{lineErrors.pricePerClass.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="lineClasses">Clases</label>
              <input id="lineClasses" type="number" step="1" {...registerLine('classesCount')} />
              {lineErrors.classesCount && <p className="error">{lineErrors.classesCount.message}</p>}
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
          <form onSubmit={handleSubmitSettlement(onValidSettlement)} noValidate>
            <div className="field">
              <label htmlFor="editSettlementTeacher">Profesor</label>
              <select id="editSettlementTeacher" {...registerSettlement('teacherId')}>
                <option value="">Seleccione profesor</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {settlementErrors.teacherId && <p className="error">{settlementErrors.teacherId.message}</p>}
            </div>
            <div className="flex-row">
              <div className="field">
                <label htmlFor="editSettlementMonth">Mes</label>
                <input id="editSettlementMonth" type="number" step="1" {...registerSettlement('periodMonth')} />
                {settlementErrors.periodMonth && <p className="error">{settlementErrors.periodMonth.message}</p>}
              </div>
              <div className="field">
                <label htmlFor="editSettlementYear">Año</label>
                <input id="editSettlementYear" type="number" step="1" {...registerSettlement('periodYear')} />
                {settlementErrors.periodYear && <p className="error">{settlementErrors.periodYear.message}</p>}
              </div>
            </div>
            <p className="mb-4 text-xs text-ink/60">
              Las clases y montos se vuelven a calcular para el profesor y periodo elegidos.
            </p>
            {settlementErrors.root && <p className="error mb-3">{settlementErrors.root.message}</p>}
            <button className="btn" type="submit" disabled={savingSettlement}>
              {savingSettlement ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
