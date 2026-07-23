const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { attachStatus: computeStatus } = require('../services/enrollmentStatusService');

function omitPasswordHash(doc) {
  const { passwordHash, ...safe } = doc.toObject();
  return safe;
}

async function attachEnrollmentSummary(student) {
  const enrollments = await Enrollment.find({ student: student._id }).populate({
    path: 'classes',
    populate: ['instrument', 'teacher'],
  });

  const summary = await Promise.all(
    enrollments.map(async (e) => {
      const { status, nextDueDate } = await computeStatus(e);
      return {
        _id: e._id,
        instrumentNames: e.classes.map((c) => c.instrument.name).join(', '),
        teacherNames: [...new Set(e.classes.map((c) => c.teacher?.name).filter(Boolean))].join(', '),
        schedule: e.classes.flatMap((c) => c.slots),
        expirationStatus: status,
        nextDueDate,
        active: e.active,
        paid: e.paid,
      };
    })
  );

  // Active enrollments, plus ones that auto-expired (real payment history) —
  // but not dead, never-paid duplicates an admin cancelled outright.
  const visible = summary.filter((e) => e.active !== false || e.nextDueDate);

  return { ...omitPasswordHash(student), enrollments: visible };
}

async function list(req, res) {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
  const withSummary = await Promise.all(students.map(attachEnrollmentSummary));
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
  if (existing) return res.status(409).json({ message: 'Ese email ya esta en uso' });

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
    if (existing) return res.status(409).json({ message: 'Ese email ya esta en uso' });
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
