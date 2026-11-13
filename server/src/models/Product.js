import mongoose from 'mongoose';
import { MAX_PRODUCT_IMAGES, PAYMENT_METHODS, PRODUCT_CONDITIONS } from '../constants/products.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    brand: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    condition: { type: String, enum: PRODUCT_CONDITIONS, required: true },
    description: { type: String, trim: true, default: '' },
    // In display order: the first one is the main photo.
    images: {
      type: [String],
      validate: (v) => v.length >= 1 && v.length <= MAX_PRODUCT_IMAGES,
    },
    // The main photo (always images[0], kept in sync below). Stored on its own
    // because cards, thumbnails and sales read just this one.
    image: { type: String },
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

// Products saved before multiple photos existed only have `image`: they read
// as a one-photo list, and are stored that way on their next save.
productSchema.post('init', function upgradeSinglePhoto() {
  if (!this.images?.length && this.image) this.images = [this.image];
});

productSchema.pre('validate', function syncMainPhoto() {
  if (!this.images?.length && this.image) this.images = [this.image];
  this.image = this.images?.[0];
});

productSchema.index({ order: 1 });

export default mongoose.model('Product', productSchema);
