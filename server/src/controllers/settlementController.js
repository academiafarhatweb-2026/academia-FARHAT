const Teacher = require('../models/Teacher');
const Settlement = require('../models/Settlement');
const { generateSettlement } = require('../services/settlementService');

const POPULATE = [
  { path: 'teacher' },
  { path: 'lines.student', select: 'name' },
  { path: 'lines.instrument' },
  { path: 'lines.plan' },
];

async function generate(req, res) {
  const { teacherId, periodMonth, periodYear } = req.body;
  if (!teacherId || !periodMonth || !periodYear) {
    return res.status(400).json({ message: 'Profesor, mes y ano son requeridos' });
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return res.status(404).json({ message: 'Profesor no encontrado' });

  const settlement = await generateSettlement(teacher, Number(periodMonth), Number(periodYear));
  const populated = await Settlement.findById(settlement._id).populate(POPULATE);
  res.json(populated);
}

async function list(req, res) {
  const { periodMonth, periodYear, teacherId } = req.query;
  const filter = {};
  if (periodMonth) filter.periodMonth = Number(periodMonth);
  if (periodYear) filter.periodYear = Number(periodYear);
  if (teacherId) filter.teacher = teacherId;

  const settlements = await Settlement.find(filter).populate(POPULATE).sort({ periodYear: -1, periodMonth: -1 });
  res.json(settlements);
}

async function getOne(req, res) {
  const settlement = await Settlement.findById(req.params.id).populate(POPULATE);
  if (!settlement) return res.status(404).json({ message: 'No encontrado' });
  res.json(settlement);
}

// Lets the admin correct a generated line by hand (a negotiated rate, a partial
// month, etc.) — the total is always recomputed server-side from pricePerClass
// and classesCount, never trusted from the client.
async function update(req, res) {
  const { lines } = req.body;
  if (!Array.isArray(lines)) {
    return res.status(400).json({ message: 'Las lineas son requeridas' });
  }

  const normalizedLines = lines.map((line) => ({
    ...line,
    total: Number(line.pricePerClass) * Number(line.classesCount),
  }));
  const totalAmount = normalizedLines.reduce((sum, l) => sum + l.total, 0);

  const settlement = await Settlement.findByIdAndUpdate(
    req.params.id,
    { lines: normalizedLines, totalAmount },
    { new: true, runValidators: true }
  ).populate(POPULATE);
  if (!settlement) return res.status(404).json({ message: 'No encontrado' });
  res.json(settlement);
}

module.exports = { generate, list, getOne, update };
