const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema(
  {
    instrument: { type: mongoose.Schema.Types.ObjectId, ref: 'Instrument', required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    rates: { type: [rateSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
