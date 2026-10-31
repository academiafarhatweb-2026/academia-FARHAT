import Payment from '../models/Payment.js';
import { createPayment } from '../services/paymentService.js';
import { spanishOrdinal } from '../utils/ordinal.js';

function buildReceipt(payment, enrollment) {
  const instrumentNames = [...new Set(enrollment.classes.map((c) => c.instrument?.name).filter(Boolean))];
  // Older payments (created before classEntries existed) fall back to the single
  // enrollment instrument for every date.
  const entries = payment.classEntries?.length
    ? payment.classEntries
    : payment.classDates.map((date) => ({ date, instrumentName: instrumentNames[0] || '' }));

  return {
    paymentId: payment._id,
    studentName: enrollment.student?.name || 'Alumno eliminado',
    amount: payment.amount,
    classesCount: payment.classesCount,
    instrumentName: instrumentNames.join(' y '),
    classDates: entries.map((entry, i) => ({
      label: `${spanishOrdinal(i + 1)} Clase - ${entry.instrumentName}`,
      date: entry.date,
    })),
    nextDueDate: payment.nextDueDate,
  };
}

export async function create(req, res) {
  const { enrollmentId, classesCount, amount } = req.body;
  if (!enrollmentId || !classesCount) {
    return res.status(400).json({ message: 'La inscripción y la cantidad de clases son requeridas' });
  }

  let result;
  try {
    // An empty "monto" field means "use the plan price", not an amount of 0/NaN.
    const manualAmount = amount === '' || amount == null ? undefined : Number(amount);
    result = await createPayment({ enrollmentId, classesCount: Number(classesCount), amount: manualAmount });
  } catch (err) {
    if (err.message === 'Enrollment not found') {
      return res.status(404).json({ message: 'No se encontró la inscripción' });
    }
    if (err.message === 'Enrollment has no schedule') {
      return res.status(400).json({ message: 'Esta inscripción no tiene clases con horario. Agregale una clase antes de registrar el pago.' });
    }
    if (err.message === 'Enrollment plan missing') {
      return res.status(400).json({ message: 'Esta inscripción no tiene un plan válido. Cargala de nuevo o indica un monto manual.' });
    }
    throw err;
  }
  res.status(201).json(buildReceipt(result.payment, result.enrollment));
}

export async function listByEnrollment(req, res) {
  const payments = await Payment.find({ enrollment: req.params.enrollmentId }).sort({ createdAt: -1 });
  res.json(payments);
}

export async function getReceipt(req, res) {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'enrollment',
    populate: [{ path: 'student' }, { path: 'classes', populate: 'instrument' }],
  });
  if (!payment || !payment.enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json(buildReceipt(payment, payment.enrollment));
}

export async function list(req, res) {
  const payments = await Payment.find()
    .populate({
      path: 'enrollment',
      populate: [{ path: 'student', select: 'name' }, { path: 'classes', populate: 'instrument' }],
    })
    .sort({ createdAt: -1 });

  const withNames = payments.map((p) => ({
    _id: p._id,
    studentName: p.enrollment?.student?.name || '',
    instrumentName: [...new Set(p.enrollment?.classes?.map((c) => c.instrument?.name).filter(Boolean))].join(', '),
    amount: p.amount,
    classesCount: p.classesCount,
    nextDueDate: p.nextDueDate,
    createdAt: p.createdAt,
  }));

  res.json(withNames);
}

export async function update(req, res) {
  const { amount, classesCount } = req.body;
  const update = {};
  if (amount != null && amount !== '') update.amount = Number(amount);
  if (classesCount != null && classesCount !== '') update.classesCount = Number(classesCount);

  const payment = await Payment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!payment) return res.status(404).json({ message: 'No encontrado' });
  res.json(payment);
}

export async function remove(req, res) {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Eliminado' });
}
