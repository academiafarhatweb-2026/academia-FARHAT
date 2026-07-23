const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { getExpirationStatus } = require('./expirationService');

// Reads the enrollment's real status from its last payment and, if it just
// expired, persists active:false so the rest of the app (dashboard counts,
// admin toggle, student portal) all agree without needing a manual click.
// It cascades to the student too — same as the manual "dar de baja" already
// does in the other direction — so a lapsed enrollment doesn't leave a
// student account looking active with nothing paid.
async function attachStatus(enrollment) {
  const lastPayment = await Payment.findOne({ enrollment: enrollment._id }).sort({ createdAt: -1 });
  const status = getExpirationStatus(lastPayment?.nextDueDate);

  if (status === 'expired' && enrollment.active) {
    await Enrollment.findByIdAndUpdate(enrollment._id, { active: false });
    enrollment.active = false;
    await User.findByIdAndUpdate(enrollment.student, { active: false });
  }

  return { status, nextDueDate: lastPayment?.nextDueDate || null };
}

module.exports = { attachStatus };
