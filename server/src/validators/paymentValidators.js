import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { number } from './common.js';

export const createPaymentValidators = [
  body('enrollmentId').notEmpty().withMessage('La inscripción es obligatoria.'),
  number(body('classesCount'), { label: 'La cantidad de clases', min: 1, integer: true }),
  number(body('amount'), { label: 'El monto', required: false, min: 0 }),
  validate,
];

export const updatePaymentValidators = [
  number(body('amount'), { label: 'El monto', required: false, min: 0 }),
  number(body('classesCount'), { label: 'La cantidad de clases', required: false, min: 1, integer: true }),
  validate,
];
