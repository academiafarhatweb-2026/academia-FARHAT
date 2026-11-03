import { body, query } from 'express-validator';
import validate from '../middleware/validate.js';
import { text } from './common.js';
import { PAYMENT_METHODS } from '../constants/products.js';
import { ISO_DATE_RE, startOfDay, todayISO } from '../utils/dates.js';

// Same rules as saleSchema in client/src/schemas.

function isoDate(chain, label) {
  return chain
    .matches(ISO_DATE_RE)
    .withMessage(`${label} no es válida.`)
    .bail()
    .custom((value) => Boolean(startOfDay(value)))
    .withMessage(`${label} no es válida.`);
}

// What can be set when registering a sale and when correcting it later.
const saleFields = [
  body('quantity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('La cantidad debe ser un número entero mayor o igual a 1.'),
  body('unitPrice')
    .notEmpty()
    .withMessage('El precio por unidad es obligatorio.')
    .bail()
    .isFloat({ gt: 0 })
    .withMessage('El precio por unidad debe ser un número mayor a 0.'),
  isoDate(body('soldAt').optional({ values: 'falsy' }), 'La fecha de venta')
    .bail()
    // ISO dates compare correctly as plain strings
    .custom((value) => value <= todayISO())
    .withMessage('La fecha de venta no puede ser futura.'),
  body('paymentMethod').optional({ values: 'falsy' }).isIn(PAYMENT_METHODS).withMessage('El medio de pago no es válido.'),
  text(body('note'), { label: 'La nota', required: false, max: 200 }),
];

export const createSaleValidators = [
  body('productId').isMongoId().withMessage('Elegí un producto válido.'),
  ...saleFields,
  validate,
];

// The product of a sale can't change: only its details.
export const updateSaleValidators = [...saleFields, validate];

export const listSalesValidators = [
  isoDate(query('from').optional({ values: 'falsy' }), 'La fecha "desde"'),
  isoDate(query('to').optional({ values: 'falsy' }), 'La fecha "hasta"'),
  validate,
];
