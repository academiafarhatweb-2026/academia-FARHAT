import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { enrollmentsApi } from '../../api/enrollments';
import { paymentsApi } from '../../api/payments';
import { useConfirm } from '../../context/ConfirmContext';
import Modal from '../../components/Modal';

export default function Payments() {
  const [searchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState(searchParams.get('enrollmentId') || '');
  const [classesCount, setClassesCount] = useState(4);
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', classesCount: '' });
  const confirm = useConfirm();

  function reloadPayments() {
    return paymentsApi.list().then((data) => {
      setPayments(data);
      setLoadingPayments(false);
    });
  }

  useEffect(() => {
    enrollmentsApi.list().then(setEnrollments);
    reloadPayments();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setReceipt(null);
    if (!enrollmentId) {
      setError('Elegi una inscripcion.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await paymentsApi.create({
        enrollmentId,
        classesCount: Number(classesCount),
        amount: amount ? Number(amount) : undefined,
      });
      setReceipt(data);
      reloadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el pago');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditPayment(p) {
    setEditingPayment(p);
    setEditForm({ amount: p.amount, classesCount: p.classesCount });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    await paymentsApi.update(editingPayment._id, {
      amount: Number(editForm.amount),
      classesCount: Number(editForm.classesCount),
    });
    setEditingPayment(null);
    reloadPayments();
  }

  async function handleDeletePayment(p) {
    const ok = await confirm({
      title: 'Eliminar pago',
      message: `Esto elimina el pago de ${p.studentName} ($${p.amount}) para siempre. Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await paymentsApi.remove(p._id);
    reloadPayments();
  }

  return (
    <div>
      <h1 className="no-print">Registrar pago</h1>

      <form className="card-form no-print" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="paymentEnrollment">Inscripcion</label>
          <select id="paymentEnrollment" value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)}>
            <option value="">Seleccione inscripcion</option>
            {enrollments.map((e) => (
              <option key={e._id} value={e._id}>
                {e.student?.name} - {e.classes?.map((c) => c.instrument?.name).join(', ')}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="paymentClasses">Cantidad de clases</label>
          <input id="paymentClasses" type="number" min="1" value={classesCount} onChange={(e) => setClassesCount(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="paymentAmount">Monto (opcional, se calcula segun el plan si se deja vacio)</label>
          <input id="paymentAmount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Registrando...' : 'Registrar pago'}
        </button>
      </form>

      {receipt && (
        <>
          <p className="no-print" style={{ textAlign: 'center', fontWeight: 600 }}>Pago registrado correctamente.</p>
          <Receipt receipt={receipt} />
        </>
      )}

      <h2 className="no-print mt-16">Historial de pagos</h2>
      <p className="no-print mb-4 text-sm text-ink/60">Todos los pagos registrados, con los mas recientes primero.</p>

      {loadingPayments ? (
        <p className="no-print">Cargando...</p>
      ) : (
        <div className="table-wrap no-print">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Instrumento</th>
                <th>Monto</th>
                <th>Clases</th>
                <th>Fecha de pago</th>
                <th>Proximo vencimiento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.studentName}</td>
                  <td>{p.instrumentName}</td>
                  <td>${p.amount}</td>
                  <td>{p.classesCount}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString('es-AR')}</td>
                  <td>{new Date(p.nextDueDate).toLocaleDateString('es-AR')}</td>
                  <td className="flex-row">
                    <button type="button" className="btn secondary" onClick={() => openEditPayment(p)}>Modificar</button>
                    <button type="button" className="btn danger" onClick={() => handleDeletePayment(p)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan="7">Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editingPayment && (
        <Modal title="Modificar pago" onClose={() => setEditingPayment(null)}>
          <form onSubmit={handleSaveEdit}>
            <div className="field">
              <label htmlFor="editAmount">Monto</label>
              <input
                id="editAmount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="editClasses">Cantidad de clases</label>
              <input
                id="editClasses"
                type="number"
                min="1"
                value={editForm.classesCount}
                onChange={(e) => setEditForm((f) => ({ ...f, classesCount: e.target.value }))}
              />
            </div>
            <p className="mb-4 text-xs text-ink/60">
              Las fechas de clase y el proximo vencimiento no se recalculan al editar; solo el monto y la cantidad quedan corregidos.
            </p>
            <button className="btn" type="submit">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Receipt({ receipt }) {
  return (
    <div className="receipt">
      <p>
        Recibi de <strong>{receipt.studentName}</strong> la suma de <strong>${receipt.amount}</strong> equivalente a{' '}
        {receipt.classesCount} clases consecutivas de <strong>{receipt.instrumentName}</strong>
      </p>
      <dl>
        {receipt.classDates.map((c, i) => (
          <Fragment key={i}>
            <dt>{c.label}:</dt>
            <dd>{new Date(c.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
          </Fragment>
        ))}
        <dt>Proxima fecha de pago:</dt>
        <dd>{new Date(receipt.nextDueDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
      </dl>
      <button className="btn no-print" onClick={() => window.print()}>Imprimir</button>
    </div>
  );
}
