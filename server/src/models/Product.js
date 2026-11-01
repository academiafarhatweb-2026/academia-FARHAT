import mongoose from 'mongoose';
import { PAYMENT_METHODS, PRODUCT_CONDITIONS } from '../constants/products.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    brand: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    condition: { type: String, enum: PRODUCT_CONDITIONS, required: true },
    description: { type: String, trim: true, default: '' },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 },
    discount: { type: Number, min: 0, max: 100, default: 0 }, // percentage
    promotion: { type: String, trim: true, default: '' },
    paymentMethods: {
      type: [{ type: String, enum: PAYMENT_METHODS }],
      validate: (v) => v.length > 0,
    },
    stock: { type: Number, required: true, min: 0 },
    minStock: { type: Number, required: true, min: 0 },
    order: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Always derived, never stored: a stale saved value could disagree with the
// price/discount actually on the product.
productSchema.virtual('finalPrice').get(function finalPrice() {
  const discounted = this.price * (1 - (this.discount || 0) / 100);
  return Math.round(discounted * 100) / 100;
});

productSchema.index({ order: 1 });

export default mongoose.model('Product', productSchema);
