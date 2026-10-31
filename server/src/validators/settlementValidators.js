import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { number } from './common.js';

export const generateSettlementValidators = [
  body('teacherId').notEmpty().withMessage('El profesor es obligatorio.'),
  number(body('periodMonth'), { label: 'El mes', min: 1, max: 12, integer: true }),
  number(body('periodYear'), { label: 'El año', min: 2000, max: 2100, integer: true }),
  validate,
];

// PUT /settlements/:id handles two shapes: editing teacher/period (identity,
// recomputes lines) or hand-correcting the lines array — both optional here
// since the controller decides which branch based on what's present.
export const updateSettlementValidators = [
  body('teacherId').optional().notEmpty().withMessage('El profesor es obligatorio.'),
  number(body('periodMonth'), { label: 'El mes', required: false, min: 1, max: 12, integer: true }),
  number(body('periodYear'), { label: 'El año', required: false, min: 2000, max: 2100, integer: true }),
  body('lines').optional().isArray().withMessage('Las líneas deben ser una lista.'),
  number(body('lines.*.value'), { label: 'El valor', required: false, min: 0 }),
  number(body('lines.*.percentage'), { label: 'El porcentaje', required: false, min: 0, max: 100 }),
  number(body('lines.*.pricePerClass'), { label: 'El precio por clase', required: false, min: 0 }),
  number(body('lines.*.classesCount'), { label: 'La cantidad de clases', required: false, min: 0, integer: true }),
  validate,
];
