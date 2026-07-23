const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0=Sunday ... 6=Saturday
    startHour: { type: Number, required: true, min: 0, max: 23 },
    endHour: { type: Number, required: true, min: 0, max: 23 },
  },
  { _id: false }
);

const fixedClassSchema = new mongoose.Schema(
  {
    instrument: { type: mongoose.Schema.Types.ObjectId, ref: 'Instrument', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    slots: { type: [slotSchema], required: true, validate: (v) => v.length > 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FixedClass', fixedClassSchema);
