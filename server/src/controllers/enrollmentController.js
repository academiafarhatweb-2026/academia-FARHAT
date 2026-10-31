import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import { getExpirationStatus } from '../services/expirationService.js';
import {
  attachStatus as computeStatus,
  deactivateStudentsWithoutActiveEnrollments,
} from '../services/enrollmentStatusService.js';

const POPULATE = [
  { path: 'student', select: 'name email phone' },
  { path: 'plan' },
  { path: 'classes', populate: ['instrument', 'teacher'] },
];

// What a student may see about their own enrollments: never the teacher's
// contact details or commission rates, nor other people's data.
const STUDENT_POPULATE = [
  { path: 'student', select: 'name' },
  { path: 'plan', select: 'name classesIncluded' },
  {
    path: 'classes',
    select: 'instrument teacher slots',
    populate: [
      { path: 'instrument', select: 'name' },
      { path: 'teacher', select: 'name' },
    ],
  },
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
    await deactivateStudentsWithoutActiveEnrollments([...studentIdsToExpire]);
  }

  return results;
}

export async function list(req, res) {
  const enrollments = await Enrollment.find().populate(POPULATE).sort({ createdAt: -1 });
  res.json(await attachStatusBatch(enrollments));
}

export async function getOne(req, res) {
  const enrollment = await Enrollment.findById(req.params.id).populate(POPULATE);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json(await attachStatus(enrollment));
}

export async function listMine(req, res) {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .select('student classes plan enrollmentDate active')
    .populate(STUDENT_POPULATE);
  const withStatus = await attachStatusBatch(enrollments);
  // Show active enrollments plus ones that auto-expired (they have payment
  // history, so the student sees the "vencido" warning) — but not dead,
  // never-paid duplicates an admin cancelled outright.
  const visible = withStatus.filter((e) => e.active !== false || e.nextDueDate);
  res.json(visible);
}

export async function create(req, res) {
  const enrollment = await Enrollment.create(req.body);
  const populated = await Enrollment.findById(enrollment._id).populate(POPULATE);
  res.status(201).json(populated);
}

export async function update(req, res) {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json(enrollment);
}

export async function remove(req, res) {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Desactivado' });
}

export async function hardRemove(req, res) {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Eliminado' });
}
