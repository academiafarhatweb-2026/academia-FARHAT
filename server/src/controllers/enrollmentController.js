const Enrollment = require('../models/Enrollment');
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

async function list(req, res) {
  const enrollments = await Enrollment.find().populate(POPULATE).sort({ createdAt: -1 });
  const withStatus = await Promise.all(enrollments.map(attachStatus));
  res.json(withStatus);
}

async function getOne(req, res) {
  const enrollment = await Enrollment.findById(req.params.id).populate(POPULATE);
  if (!enrollment) return res.status(404).json({ message: 'No encontrado' });
  res.json(await attachStatus(enrollment));
}

async function listMine(req, res) {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate(POPULATE);
  const withStatus = await Promise.all(enrollments.map(attachStatus));
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
