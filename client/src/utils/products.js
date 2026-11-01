// Option lists for stock products. Mirrored in server/src/constants/products.js —
// keep both in sync when adding an option.

export const CONDITION_LABELS = {
  new: 'Nuevo',
  used: 'Usado',
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  debit: 'Débito',
  credit: 'Crédito',
  interest_free_installments: 'Cuotas sin interés',
  mercado_pago: 'Mercado Pago',
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS);

// Same limits the server enforces on /uploads/product-image.
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const priceFormat = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value) {
  return priceFormat.format(Number(value) || 0);
}

// Same formula as the Product model's finalPrice virtual.
export function finalPrice(price, discount) {
  const discounted = (Number(price) || 0) * (1 - (Number(discount) || 0) / 100);
  return Math.round(discounted * 100) / 100;
}

// 'out' wins over 'low': a product at 0 is also at or under its minimum.
export function stockStatus({ stock, minStock }) {
  if (stock <= 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
}

export function productTitle({ name, brand, model }) {
  return [name, brand, model].filter(Boolean).join(' ');
}
