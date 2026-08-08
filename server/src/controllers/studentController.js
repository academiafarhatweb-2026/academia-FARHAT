const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { getExpirationStatus } = require('../services/expirationService');

function omitPasswordHash(doc) {
  const { passwordHash, ...safe } = doc.toObject();
  return safe;
}

// Same per-enrollment status/summary shape as enrollmentStatusService.attachStatus,
// but computed from data already fetched in bulk by list() below — doing this
// one enrollment/payment at a time (N+1 queries) made /api/students take several
// seconds once there were a couple dozen students, so list() batches it instead.
async function list(req, res) {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
  const studentIds = students.map((s) => s._id);

  const enrollments = await Enrollment.find({ student: { $in: studentIds } }).populate({
    path: 'classes',
    populate: ['instrument', 'teacher'],
  });
  const enrollmentIds = enrollments.map((e) => e._id);

  const payments = await Payment.find({ enrollment: { $in: enrollmentIds } }).sort({ createdAt: -1 });
  const lastPaymentByEnrollment = new Map();
  for (const p of payments) {
    const key = p.enrollment.toString();
    if (!lastPaymentByEnrollment.has(key)) lastPaymentByEnrollment.set(key, p); // sorted desc, so first hit wins
  }

  const toExpireIds = [];
  const studentIdsToExpire = new Set();
  const entriesByStudent = new Map();
  for (const e of enrollments) {
    const lastPayment = lastPaymentByEnrollment.get(e._id.toString());
    const status = getExpirationStatus(lastPayment?.nextDueDate);
    if (status === 'expired' && e.active) {
      toExpireIds.push(e._id);
      studentIdsToExpire.add(e.student.toString());
      e.active = false;
    }
    const key = e.student.toString();
    if (!entriesByStudent.has(key)) entriesByStudent.set(key, []);
    entriesByStudent.get(key).push({ enrollment: e, status, nextDueDate: lastPayment?.nextDueDate || null });
  }

  if (toExpireIds.length > 0) {
    await Enrollment.updateMany({ _id: { $in: toExpireIds } }, { active: false });
    await User.updateMany({ _id: { $in: [...studentIdsToExpire] } }, { active: false });
  }

  const withSummary = students.map((student) => {
    const entries = entriesByStudent.get(student._id.toString()) || [];
    const summary = entries.map(({ enrollment: e, status, nextDueDate }) => ({
      _id: e._id,
      instrumentNames: [...new Set(e.classes.map((c) => c.instrument?.name).filter(Boolean))].join(', '),
      teacherNames: [...new Set(e.classes.map((c) => c.teacher?.name).filter(Boolean))].join(', '),
      schedule: e.classes.flatMap((c) => c.slots),
      expirationStatus: status,
      nextDueDate,
      active: e.active,
      paid: e.paid,
    }));

    // Active enrollments, plus ones that auto-expired (real payment history) —
    // but not dead, never-paid duplicates an admin cancelled outright.
    const visible = summary.filter((en) => en.active !== false || en.nextDueDate);
    return { ...omitPasswordHash(student), enrollments: visible };
  });

  res.json(withSummary);
}

async function getOne(req, res) {
  const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('-passwordHash');
  if (!student) return res.status(404).json({ message: 'No encontrado' });
  res.json(student);
}

async function create(req, res) {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'El nombre y el email son requeridos' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return res.status(409).json({ message: 'Ese email ya está en uso' });

  const student = await User.create({
    name,
    email: email.toLowerCase().trim(),
    phone,
    role: 'student',
  });

  res.status(201).json(omitPasswordHash(student));
}

async function update(req, res) {
  const { name, email, phone, active } = req.body;

  const update = { name, phone, active };
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ message: 'Ese email ya está en uso' });
    update.email = normalizedEmail;
  }

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    update,
    { new: true, runValidators: true }
  );
  if (!student) return res.status(404).json({ message: 'No encontrado' });

  // A student who's given up shouldn't keep showing "active" classes.
  if (active === false) {
    await Enrollment.updateMany({ student: student._id, active: true }, { active: false });
  }

  res.json(omitPasswordHash(student));
}

async function remove(req, res) {
  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    { active: false },
    { new: true }
  );
  if (!student) return res.status(404).json({ message: 'No encontrado' });

  await Enrollment.updateMany({ student: student._id, active: true }, { active: false });

  res.json({ message: 'Desactivado' });
}

async function hardRemove(req, res) {
  const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'No encontrado' });
  res.json({ message: 'Eliminado' });
}

module.exports = { list, getOne, create, update, remove, hardRemove };
