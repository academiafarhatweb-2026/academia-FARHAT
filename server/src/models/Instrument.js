const mongoose = require('mongoose');

const instrumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isPublic: { type: Boolean, default: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Instrument', instrumentSchema);
