import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { personName, email, phone } from './common.js';

export const studentValidators = [
  personName(body('name'), { label: 'El nombre' }),
  email(body('email'), { label: 'El email' }),
  phone(body('phone'), { label: 'El teléfono', required: false }),
  body('active').optional().isBoolean().withMessage('El estado debe ser verdadero o falso.'),
  validate,
];
