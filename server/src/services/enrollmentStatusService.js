import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { getExpirationStatus } from './expirationService.js';

// Reads the enrollment's real status from its last payment and, if it just
// expired, persists active:false so the rest of the app (dashboard counts,
// admin toggle, student portal) all agree without needing a manual click.
// It cascades to the student too — same as the manual "dar de baja" already
// does in the other direction — so a lapsed enrollment doesn't leave a
// student account looking active with nothing paid.
export async function attachStatus(enrollment) {
  const lastPayment = await Payment.findOne({ enrollment: enrollment._id }).sort({ createdAt: -1 });
  const status = getExpirationStatus(lastPayment?.nextDueDate);

  if (status === 'expired' && enrollment.active) {
    await Enrollment.findByIdAndUpdate(enrollment._id, { active: false });
    enrollment.active = false;
    await deactivateStudentsWithoutActiveEnrollments([enrollment.student?._id || enrollment.student]);
  }

  return { status, nextDueDate: lastPayment?.nextDueDate || null };
}

// Only deactivates a student once none of their enrollments is still active —
// one lapsed enrollment must not lock out a student who's paid up on another.
export async function deactivateStudentsWithoutActiveEnrollments(studentIds) {
  const ids = studentIds.filter(Boolean).map(String);
  if (ids.length === 0) return;
  const stillActive = await Enrollment.distinct('student', { student: { $in: ids }, active: true });
  const stillActiveIds = new Set(stillActive.map(String));
  const toDeactivate = ids.filter((id) => !stillActiveIds.has(id));
  if (toDeactivate.length > 0) {
    await User.updateMany({ _id: { $in: toDeactivate } }, { active: false });
  }
}
