const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { number } = require('./common');

const createPaymentValidators = [
  body('enrollmentId').notEmpty().withMessage('La inscripción es obligatoria.'),
  number(body('classesCount'), { label: 'La cantidad de clases', min: 1, integer: true }),
  number(body('amount'), { label: 'El monto', required: false, min: 0 }),
  validate,
];

const updatePaymentValidators = [
  number(body('amount'), { label: 'El monto', required: false, min: 0 }),
  number(body('classesCount'), { label: 'La cantidad de clases', required: false, min: 1, integer: true }),
  validate,
];

module.exports = { createPaymentValidators, updatePaymentValidators };
