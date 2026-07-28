const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Settlement = require('../models/Settlement');

function countDatesInRange(dates, start, end) {
  return dates.filter((d) => d >= start && d < end).length;
}

// Attributes each enrollment to the teacher/instrument of its first fixed class.
// Assumes an enrollment's classes share one teacher+instrument (typical case in this academy).
async function computeSettlementLines(teacher, periodMonth, periodYear) {
  const start = new Date(periodYear, periodMonth - 1, 1);
  const end = new Date(periodYear, periodMonth, 1);

  const enrollments = await Enrollment.find()
    .populate('student')
    .populate('plan')
    .populate({ path: 'classes', populate: ['instrument', 'teacher'] });

  const lines = [];
  let totalAmount = 0;

  for (const enrollment of enrollments) {
    const primaryClass = enrollment.classes[0];
    // Skip enrollments whose teacher/instrument/plan was deleted without
    // cleaning up the reference — nothing to settle against without all three.
    if (!primaryClass || !primaryClass.teacher || !primaryClass.instrument || !enrollment.plan || !enrollment.student) continue;
    if (primaryClass.teacher._id.toString() !== teacher._id.toString()) continue;

    const payments = await Payment.find({ enrollment: enrollment._id });
    const allDates = payments.flatMap((p) => p.classDates);
    const classesCount = countDatesInRange(allDates, start, end);
    if (classesCount === 0) continue;

    const rate = teacher.rates.find(
      (r) => r.instrument.toString() === primaryClass.instrument._id.toString()
    );
    if (!rate) continue;

    const value = enrollment.customValue ?? enrollment.plan.value;
    const pricePerClass = (value * rate.percentage) / 100 / enrollment.plan.classesIncluded;
    const total = pricePerClass * classesCount;
    totalAmount += total;

    lines.push({
      enrollment: enrollment._id,
      student: enrollment.student._id,
      instrument: primaryClass.instrument._id,
      plan: enrollment.plan._id,
      value,
      percentage: rate.percentage,
      classesIncluded: enrollment.plan.classesIncluded,
      pricePerClass,
      classesCount,
      total,
    });
  }

  return { lines, totalAmount };
}

async function generateSettlement(teacher, periodMonth, periodYear) {
  const { lines, totalAmount } = await computeSettlementLines(teacher, periodMonth, periodYear);

  const settlement = await Settlement.findOneAndUpdate(
    { teacher: teacher._id, periodMonth, periodYear },
    { lines, totalAmount, generatedAt: new Date() },
    { new: true, upsert: true }
  );

  return settlement;
}

module.exports = { generateSettlement, computeSettlementLines };
