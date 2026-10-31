import mongoose from 'mongoose';

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

export default mongoose.model('Instrument', instrumentSchema);
