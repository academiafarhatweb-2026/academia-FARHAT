const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { getExpirationStatus } = require('../services/expirationService');
const { attachStatus: computeStatus } = require('../services/enrollmentStatusService');

const POPULATE = [
  { path: 'student', select: 'name email phone' },
  { path: 'plan' },
  { path: 'classes', populate: ['instrument', 'teacher'] },
];

async function attachStatus(enrollment) {
  const { status, nextDueDate } = await computeStatus(enrollment);
  return { ...enrollment.toObject(), expirationStatus: status, nextDueDate };
}

// Same per-enrollment status computation as enrollmentStatusService.attachStatus,
// but batched: one Payment query for every enrollment instead of one query per
// enrollment. list() was taking 2-4s with 50+ enrollments doing it one at a time.
async function attachStatusBatch(enrollments) {
  const ids = enrollments.map((e) => e._id);
  const payments = await Payment.find({ enrollment: { $in: ids } }).sort({ createdAt: -1 });
  const lastPaymentByEnrollment = new Map();
  for (const p of payments) {
    const key = p.enrollment.toString();
    if (!lastPaymentByEnrollment.has(key)) lastPaymentByEnrollment.set(key, p); // sorted desc, first hit wins
  }

  const toExpireIds = [];
  const studentIdsToExpire = new Set();
  const results = enrollments.map((e) => {
    const lastPayment = lastPaymentByEnrollment.get(e._id.toString());
    const status = getExpirationStatus(lastPayment?.nextDueDate);
    if (status === 'expired' && e.active) {
      toExpireIds.push(e._id);
      if (e.student?._id) studentIdsToExpire.add(e.student._id.toString());
      e.active = false;
    }
    return { ...e.toObject(), expirationStatus: status, nextDueDate: lastPayment?.nextDueDate || null };
  });

  if (toExpireIds.length > 0) {
    await Enrollment.updateMany({ _id: { $in: toExpireIds } }, { active: false });
    if (studentIdsToExpire.size > 0) {
      await User.updateMany({ _id: { $in: [...studentIdsToExpire] } }, { active: false });
    }
  }

  return results;
}

async function list(req, res) {
  const enrollments = await Enrollment.find().populate(POPULATE).sort({ createdAt: -1 });
  res.json(await attachStatusBatch(enrollments));
}

async function getOne(req, res) {
  const enrollment = await Enrollment.findById(req.params.id).populate(POPULATE);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json(await attachStatus(enrollment));
}

async function listMine(req, res) {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate(POPULATE);
  const withStatus = await attachStatusBatch(enrollments);
  // Show active enrollments plus ones that auto-expired (they have payment
  // history, so the student sees the "vencido" warning) — but not dead,
  // never-paid duplicates an admin cancelled outright.
  const visible = withStatus.filter((e) => e.active !== false || e.nextDueDate);
  res.json(visible);
}

async function create(req, res) {
  const enrollment = await Enrollment.create(req.body);
  const populated = await Enrollment.findById(enrollment._id).populate(POPULATE);
  res.status(201).json(populated);
}

async function update(req, res) {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json(enrollment);
}

async function remove(req, res) {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Desactivado' });
}

async function hardRemove(req, res) {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Eliminado' });
}

module.exports = { list, getOne, listMine, create, update, remove, hardRemove };
