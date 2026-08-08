const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { number } = require('./common');

// Enrollments.jsx's "Nueva inscripción" form always sends customValue, but
// ClassDetailModal's quick "+ Agregar alumno" doesn't — it relies on the
// model's own fallback to the plan's value, same as customValue being
// optional on the Enrollment schema itself.
const createEnrollmentValidators = [
  body('student').notEmpty().withMessage('El alumno es obligatorio.'),
  body('plan').notEmpty().withMessage('El precio es obligatorio.'),
  number(body('customValue'), { label: 'El precio', required: false, min: 0 }),
  body('enrollmentDate').notEmpty().withMessage('La fecha de inscripción es obligatoria.'),
  body('classes').isArray({ min: 1 }).withMessage('Agregá al menos una clase.'),
  validate,
];

// PUT is reused for several partial updates (dar de baja/alta, marcar pagado,
// quitar una clase de una inscripción) — only validate fields that are present.
const updateEnrollmentValidators = [
  body('student').optional().notEmpty().withMessage('El alumno es obligatorio.'),
  body('plan').optional().notEmpty().withMessage('El precio es obligatorio.'),
  number(body('customValue'), { label: 'El precio', required: false, min: 0 }),
  body('enrollmentDate').optional().notEmpty().withMessage('La fecha de inscripción es obligatoria.'),
  body('classes').optional().isArray().withMessage('Las clases deben ser una lista.'),
  body('active').optional().isBoolean().withMessage('El estado debe ser verdadero o falso.'),
  body('paid').optional().isBoolean().withMessage('El pago debe ser verdadero o falso.'),
  validate,
];

module.exports = { createEnrollmentValidators, updateEnrollmentValidators };
