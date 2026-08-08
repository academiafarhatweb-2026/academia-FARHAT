import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enrollmentsApi } from '../../api/enrollments';
import { paymentsApi } from '../../api/payments';
import { useConfirm } from '../../context/ConfirmContext';
import Modal from '../../components/Modal';
import { paymentCreateSchema, paymentEditSchema } from '../../schemas';

export default function Payments() {
  const [searchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState(null);
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentCreateSchema),
    defaultValues: { enrollmentId: searchParams.get('enrollmentId') || '', classesCount: '4', amount: '' },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm({ resolver: zodResolver(paymentEditSchema), defaultValues: { amount: '', classesCount: '' } });

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

  async function onValid(data) {
    if (submitting) return;
    setReceipt(null);
    setSubmitting(true);
    try {
      const result = await paymentsApi.create({
        enrollmentId: data.enrollmentId,
        classesCount: Number(data.classesCount),
        amount: data.amount ? Number(data.amount) : undefined,
      });
      setReceipt(result);
      reloadPayments();
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'No se pudo registrar el pago' });
    } finally {
      setSubmitting(false);
    }
  }

  function openEditPayment(p) {
    setEditingPayment(p);
    resetEdit({ amount: String(p.amount), classesCount: String(p.classesCount) });
  }

  async function onValidEdit(data) {
    if (savingEdit) return;
    setSavingEdit(true);
    try {
      await paymentsApi.update(editingPayment._id, {
        amount: Number(data.amount),
        classesCount: Number(data.classesCount),
      });
      setEditingPayment(null);
      reloadPayments();
    } finally {
      setSavingEdit(false);
    }
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

  async function handleViewReceipt(p) {
    setLoadingReceiptId(p._id);
    try {
      const data = await paymentsApi.getReceipt(p._id);
      setViewingReceipt(data);
    } finally {
      setLoadingReceiptId(null);
    }
  }

  return (
    <div>
      <h1 className="no-print">Registrar pago</h1>

      <form className="card-form no-print" onSubmit={handleSubmit(onValid)} noValidate>
        <div className="field">
          <label htmlFor="paymentEnrollment">Inscripción</label>
          <select id="paymentEnrollment" {...register('enrollmentId')}>
            <option value="">Seleccione inscripción</option>
            {enrollments.map((e) => (
              <option key={e._id} value={e._id}>
                {e.student?.name} - {e.classes?.map((c) => c.instrument?.name).join(', ')}
              </option>
            ))}
          </select>
          {errors.enrollmentId && <p className="error">{errors.enrollmentId.message}</p>}
        </div>

        <div className="field">
          <label htmlFor="paymentClasses">Cantidad de clases</label>
          <input id="paymentClasses" type="number" step="1" {...register('classesCount')} />
          {errors.classesCount && <p className="error">{errors.classesCount.message}</p>}
        </div>

        <div className="field">
          <label htmlFor="paymentAmount">Monto (opcional, se calcula según el plan si se deja vacío)</label>
          <input id="paymentAmount" type="number" step="0.01" {...register('amount')} />
          {errors.amount && <p className="error">{errors.amount.message}</p>}
        </div>

        {errors.root && <p className="error">{errors.root.message}</p>}
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
      <p className="no-print mb-4 text-sm text-ink/60">Todos los pagos registrados, con los más recientes primero.</p>

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
                <th>Próximo vencimiento</th>
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
                    <button type="button" className="btn secondary" onClick={() => handleViewReceipt(p)} disabled={loadingReceiptId === p._id}>
                      {loadingReceiptId === p._id ? 'Cargando...' : 'Ver / Guardar PDF'}
                    </button>
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
          <form onSubmit={handleSubmitEdit(onValidEdit)} noValidate>
            <div className="field">
              <label htmlFor="editAmount">Monto</label>
              <input id="editAmount" type="number" step="0.01" {...registerEdit('amount')} />
              {editErrors.amount && <p className="error">{editErrors.amount.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="editClasses">Cantidad de clases</label>
              <input id="editClasses" type="number" step="1" {...registerEdit('classesCount')} />
              {editErrors.classesCount && <p className="error">{editErrors.classesCount.message}</p>}
            </div>
            <p className="mb-4 text-xs text-ink/60">
              Las fechas de clase y el próximo vencimiento no se recalculan al editar; solo el monto y la cantidad quedan corregidos.
            </p>
            <button className="btn" type="submit" disabled={savingEdit}>
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {viewingReceipt && (
        <Modal title="Recibo" onClose={() => setViewingReceipt(null)}>
          <Receipt receipt={viewingReceipt} />
        </Modal>
      )}
    </div>
  );
}

function Receipt({ receipt }) {
  return (
    <div className="receipt">
      <p>
        Recibí de <strong>{receipt.studentName}</strong> la suma de <strong>${receipt.amount}</strong> equivalente a{' '}
        {receipt.classesCount} clases consecutivas de <strong>{receipt.instrumentName}</strong>
      </p>
      <dl>
        {receipt.classDates.map((c, i) => (
          <Fragment key={i}>
            <dt>{c.label}:</dt>
            <dd>{new Date(c.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
          </Fragment>
        ))}
        <dt>Próxima fecha de pago:</dt>
        <dd>{new Date(receipt.nextDueDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
      </dl>
      <button className="btn no-print" onClick={() => window.print()}>Guardar PDF</button>
    </div>
  );
}
