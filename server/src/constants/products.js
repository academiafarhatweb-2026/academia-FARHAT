// Allowed values for stock products. Mirrored in client/src/utils/products.js —
// keep both lists in sync when adding an option.

export const PRODUCT_CONDITIONS = ['new', 'used'];

export const PAYMENT_METHODS = [
  'cash',
  'transfer',
  'debit',
  'credit',
  'interest_free_installments',
  'mercado_pago',
];

// Offered as suggestions in the (free-text) category field; never stored
// until a product actually uses one.
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Guitarras',
  'Bajos',
  'Teclados',
  'Percusión',
  'Vientos',
  'Accesorios',
  'Cuerdas',
  'Audio/Amplificación',
];
