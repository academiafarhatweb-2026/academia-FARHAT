const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { getNextOccurrences } = require('./occurrenceService');

async function createPayment({ enrollmentId, classesCount, amount }) {
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate({ path: 'classes', populate: 'instrument' })
    .populate('plan')
    .populate('student');
  if (!enrollment) throw new Error('Enrollment not found');

  // Each slot carries its own instrument name, so a payment covering an enrollment
  // with several classes (e.g. Canto + Guitarra on different days) can tell which
  // class each occurrence belongs to instead of assuming they're all the same instrument.
  const slots = enrollment.classes.flatMap((c) =>
    c.slots.map((s) => ({ day: s.day, startHour: s.startHour, endHour: s.endHour, instrumentName: c.instrument.name }))
  );

  const lastPayment = await Payment.findOne({ enrollment: enrollmentId }).sort({ createdAt: -1 });
  const anchorDate = lastPayment
    ? lastPayment.classDates[lastPayment.classDates.length - 1]
    : new Date(new Date(enrollment.enrollmentDate).setDate(enrollment.enrollmentDate.getDate() - 1));

  const occurrences = getNextOccurrences(slots, anchorDate, classesCount);
  const classDates = occurrences.map((o) => o.date);
  const classEntries = occurrences.map((o) => ({ date: o.date, instrumentName: o.slot.instrumentName }));
  const [nextOccurrence] = getNextOccurrences(slots, classDates[classDates.length - 1], 1);
  const nextDueDate = nextOccurrence.date;

  const planValue = enrollment.customValue ?? enrollment.plan.value;
  const finalAmount = amount != null ? amount : (planValue / enrollment.plan.classesIncluded) * classesCount;

  const payment = await Payment.create({
    enrollment: enrollmentId,
    amount: finalAmount,
    classesCount,
    classDates,
    classEntries,
    nextDueDate,
  });

  // A registered payment is a renewal: bring the enrollment (and the student,
  // if they'd been auto-deactivated along with it) back to active, and mark
  // this enrollment as paid again automatically — no manual toggle needed.
  if (!enrollment.active) {
    await Enrollment.findByIdAndUpdate(enrollmentId, { active: true, paid: true });
    enrollment.active = true;
  } else {
    await Enrollment.findByIdAndUpdate(enrollmentId, { paid: true });
  }

  if (enrollment.student && !enrollment.student.active) {
    await User.findByIdAndUpdate(enrollment.student._id, { active: true });
  }

  return { payment, enrollment };
}

module.exports = { createPayment };
