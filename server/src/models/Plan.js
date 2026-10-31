import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
    classesIncluded: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Plan', planSchema);
