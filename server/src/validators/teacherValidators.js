import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { personName, email, phone, number } from './common.js';

export const teacherValidators = [
  personName(body('name'), { label: 'El nombre' }),
  phone(body('phone'), { label: 'El teléfono', required: false }),
  email(body('email'), { label: 'El email', required: false }),
  body('rates').optional().isArray().withMessage('Las comisiones deben ser una lista.'),
  body('rates.*.instrument').notEmpty().withMessage('El instrumento de la comisión es obligatorio.'),
  number(body('rates.*.percentage'), { label: 'La comisión', min: 0, max: 100 }),
  validate,
];
