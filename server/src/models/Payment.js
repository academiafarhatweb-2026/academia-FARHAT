const mongoose = require('mongoose');

const classEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    instrumentName: { type: String, required: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    amount: { type: Number, required: true, min: 0 },
    classesCount: { type: Number, required: true, min: 1 },
    classDates: { type: [Date], required: true },
    // Same dates as classDates, but each tagged with its instrument — lets the
    // receipt show which class a date belongs to when an enrollment mixes several.
    classEntries: { type: [classEntrySchema], default: [] },
    nextDueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
