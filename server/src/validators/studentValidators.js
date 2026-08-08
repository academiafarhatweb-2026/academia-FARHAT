const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { personName, email, phone } = require('./common');

const studentValidators = [
  personName(body('name'), { label: 'El nombre' }),
  email(body('email'), { label: 'El email' }),
  phone(body('phone'), { label: 'El teléfono', required: false }),
  body('active').optional().isBoolean().withMessage('El estado debe ser verdadero o falso.'),
  validate,
];

module.exports = { studentValidators };
