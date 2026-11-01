import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { text, number } from './common.js';
import { PAYMENT_METHODS, PRODUCT_CONDITIONS } from '../constants/products.js';

// Same rules as productSchema in client/src/schemas — the server never trusts
// that the form already checked them.

const CLOUDINARY_IMAGE_RE = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+/;

function image({ required }) {
  let chain = body('image').trim();
  chain = required ? chain.notEmpty().withMessage('La foto es obligatoria.') : chain.optional({ checkFalsy: true });
  return chain.matches(CLOUDINARY_IMAGE_RE).withMessage('La foto debe subirse desde el formulario.');
}

const productFields = [
  text(body('name'), { label: 'El nombre', min: 2, max: 100 }),
  text(body('brand'), { label: 'La marca', required: false, max: 60 }),
  text(body('model'), { label: 'El modelo', required: false, max: 60 }),
  body('category')
    .isString()
    .withMessage('La categoría es obligatoria.')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('La categoría es obligatoria.')
    .bail()
    .isLength({ min: 2, max: 40 })
    .withMessage('La categoría debe tener entre 2 y 40 caracteres.'),
  body('condition')
    .notEmpty()
    .withMessage('El estado es obligatorio.')
    .bail()
    .isIn(PRODUCT_CONDITIONS)
    .withMessage('El estado debe ser Nuevo o Usado.'),
  text(body('description'), { label: 'La descripción', required: false, max: 300 }),
  body('price')
    .notEmpty()
    .withMessage('El precio es obligatorio.')
    .bail()
    .isFloat({ gt: 0 })
    .withMessage('El precio debe ser un número mayor a 0.'),
  number(body('discount'), { label: 'El descuento', required: false, min: 0, max: 100 }),
  text(body('promotion'), { label: 'La promoción', required: false, max: 80 }),
  body('paymentMethods').isArray({ min: 1 }).withMessage('Elegí al menos un medio de pago.'),
  body('paymentMethods.*').isIn(PAYMENT_METHODS).withMessage('Hay un medio de pago inválido.'),
  number(body('stock'), { label: 'El stock actual', min: 0, integer: true }),
  number(body('minStock'), { label: 'El stock mínimo', min: 0, integer: true }),
  body('order')
    .notEmpty()
    .withMessage('El orden es obligatorio.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('El orden debe ser un número entero mayor o igual a 1.'),
  body('active').optional().isBoolean().withMessage('El estado activo debe ser verdadero o falso.'),
];

export const createProductValidators = [...productFields, image({ required: true }), validate];

// On edit the photo can stay as it was, so it's only checked when it's sent.
export const updateProductValidators = [...productFields, image({ required: false }), validate];

export const adjustStockValidators = [
  body('delta')
    .isInt({ min: -1000, max: 1000 })
    .withMessage('El ajuste debe ser un número entero.')
    .bail()
    .custom((delta) => Number(delta) !== 0)
    .withMessage('El ajuste no puede ser 0.'),
  validate,
];

export const reorderProductsValidators = [
  body('ids').isArray({ min: 1 }).withMessage('Falta el nuevo orden de los productos.'),
  body('ids.*').isMongoId().withMessage('Hay un producto inválido en el orden.'),
  validate,
];
