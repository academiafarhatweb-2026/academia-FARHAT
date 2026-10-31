import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { text, number } from './common.js';

export const planValidators = [
  text(body('name'), { label: 'El nombre', min: 2, max: 40 }),
  number(body('value'), { label: 'El valor', min: 0 }),
  number(body('classesIncluded'), { label: 'La cantidad de clases incluidas', min: 1, integer: true }),
  validate,
];
