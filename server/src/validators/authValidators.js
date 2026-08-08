const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { email } = require('./common');

const adminLoginValidators = [
  email(body('email'), { label: 'El email' }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria.')
    .isLength({ min: 6, max: 100 })
    .withMessage('La contraseña debe tener entre 6 y 100 caracteres.'),
  validate,
];

const studentLoginValidators = [email(body('email'), { label: 'El email' }), validate];

module.exports = { adminLoginValidators, studentLoginValidators };
