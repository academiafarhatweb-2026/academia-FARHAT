const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { text, number } = require('./common');

const planValidators = [
  text(body('name'), { label: 'El nombre', min: 2, max: 40 }),
  number(body('value'), { label: 'El valor', min: 0 }),
  number(body('classesIncluded'), { label: 'La cantidad de clases incluidas', min: 1, integer: true }),
  validate,
];

module.exports = { planValidators };
