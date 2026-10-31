import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { email } from './common.js';

export const adminLoginValidators = [
  email(body('email'), { label: 'El email' }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria.')
    .isLength({ min: 6, max: 100 })
    .withMessage('La contraseña debe tener entre 6 y 100 caracteres.'),
  validate,
];

export const studentLoginValidators = [email(body('email'), { label: 'El email' }), validate];
