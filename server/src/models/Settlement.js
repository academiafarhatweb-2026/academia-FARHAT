const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  {
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    instrument: { type: mongoose.Schema.Types.ObjectId, ref: 'Instrument', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    value: { type: Number, required: true },
    percentage: { type: Number, required: true },
    classesIncluded: { type: Number, required: true },
    pricePerClass: { type: Number, required: true },
    classesCount: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const settlementSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    periodMonth: { type: Number, required: true, min: 1, max: 12 },
    periodYear: { type: Number, required: true },
    lines: { type: [lineSchema], default: [] },
    totalAmount: { type: Number, required: true, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

settlementSchema.index({ teacher: 1, periodMonth: 1, periodYear: 1 }, { unique: true });

module.exports = mongoose.model('Settlement', settlementSchema);
