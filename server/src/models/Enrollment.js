const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FixedClass', required: true }],
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    // Overrides the plan's value for this specific enrollment (e.g. a negotiated
    // rate) — payments and settlements use this instead of plan.value when set.
    customValue: { type: Number },
    enrollmentDate: { type: Date, required: true, default: Date.now },
    active: { type: Boolean, default: true },
    // Manual admin toggle for quick control, independent of the auto-computed
    // expirationStatus (which is driven by real Payment records and due dates).
    // Starts false: a brand-new enrollment hasn't been paid yet. paymentService
    // flips it to true automatically the moment a real payment is registered.
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
