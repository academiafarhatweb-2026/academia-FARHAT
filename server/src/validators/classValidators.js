const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { number } = require('./common');

const classValidators = [
  body('instrument').notEmpty().withMessage('El instrumento es obligatorio.'),
  body('teacher').notEmpty().withMessage('El profesor es obligatorio.'),
  body('slots').isArray({ min: 1 }).withMessage('Agregá al menos un horario.'),
  number(body('slots.*.day'), { label: 'El día', min: 0, max: 6, integer: true }),
  number(body('slots.*.startHour'), { label: 'La hora de inicio', min: 0, max: 23, integer: true }),
  number(body('slots.*.endHour'), { label: 'La hora de fin', min: 0, max: 23, integer: true }),
  body('slots').custom((slots) => {
    if (!Array.isArray(slots)) return true;
    const invalid = slots.some((s) => Number(s.endHour) <= Number(s.startHour));
    if (invalid) throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
    return true;
  }),
  validate,
];

module.exports = { classValidators };
