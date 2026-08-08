const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { personName, email, phone, number } = require('./common');

const teacherValidators = [
  personName(body('name'), { label: 'El nombre' }),
  phone(body('phone'), { label: 'El teléfono', required: false }),
  email(body('email'), { label: 'El email', required: false }),
  body('rates').optional().isArray().withMessage('Las comisiones deben ser una lista.'),
  body('rates.*.instrument').notEmpty().withMessage('El instrumento de la comisión es obligatorio.'),
  number(body('rates.*.percentage'), { label: 'La comisión', min: 0, max: 100 }),
  validate,
];

module.exports = { teacherValidators };
