import mongoose from 'mongoose';

const homeContentSchema = new mongoose.Schema(
  {
    heroImages: { type: [String], default: [] },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('HomeContent', homeContentSchema);
