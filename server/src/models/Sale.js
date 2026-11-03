import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../constants/products.js';

// One sale of a stock product. Name/brand/model/category are copied at the
// moment of the sale, so the record stays readable even if the product is
// later edited or deleted.
const saleSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productBrand: { type: String, default: '' },
    productModel: { type: String, default: '' },
    productCategory: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0.01 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS, ''], default: '' },
    note: { type: String, trim: true, default: '' },
    soldAt: { type: Date, required: true },
  },
  { timestamps: true }
);

saleSchema.index({ soldAt: -1 });

export default mongoose.model('Sale', saleSchema);
