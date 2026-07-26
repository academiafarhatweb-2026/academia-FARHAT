const Payment = require('../models/Payment');
const { createPayment } = require('../services/paymentService');
const { spanishOrdinal } = require('../utils/ordinal');

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

async function create(req, res) {
  const { enrollmentId, classesCount, amount } = req.body;
  if (!enrollmentId || !classesCount) {
    return res.status(400).json({ message: 'La inscripcion y la cantidad de clases son requeridas' });
  }

  let result;
  try {
    result = await createPayment({ enrollmentId, classesCount, amount });
  } catch (err) {
    if (err.message === 'Enrollment not found') {
      return res.status(404).json({ message: 'No se encontro la inscripcion' });
    }
    if (err.message === 'Enrollment plan missing') {
      return res.status(400).json({ message: 'Esta inscripcion no tiene un plan valido. Cargala de nuevo o indica un monto manual.' });
    }
    throw err;
  }
  res.status(201).json(buildReceipt(result.payment, result.enrollment));
}

async function listByEnrollment(req, res) {
  const payments = await Payment.find({ enrollment: req.params.enrollmentId }).sort({ createdAt: -1 });
  res.json(payments);
}

async function list(req, res) {
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

async function update(req, res) {
  const { amount, classesCount } = req.body;
  const update = {};
  if (amount != null) update.amount = amount;
  if (classesCount != null) update.classesCount = classesCount;

  const payment = await Payment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!payment) return res.status(404).json({ message: 'No encontrado' });
  res.json(payment);
}

async function remove(req, res) {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Eliminado' });
}

module.exports = { create, list, listByEnrollment, update, remove };
