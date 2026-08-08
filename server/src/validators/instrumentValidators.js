const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { text, number } = require('./common');

// Instruments.jsx (admin catalog form) sends name/order/isPublic on create.
const createInstrumentValidators = [
  text(body('name'), { label: 'El nombre', min: 2, max: 40 }),
  body('isPublic').optional().isBoolean().withMessage('El campo "Mostrar en el Home" debe ser verdadero o falso.'),
  number(body('order'), { label: 'El orden', required: false, min: 0, integer: true }),
  validate,
];

// PUT is also used by HomeEditor.jsx's per-instrument draft save, which only
// sends { isPublic, description, images } — no name/order — so nothing here
// can be unconditionally required.
const updateInstrumentValidators = [
  text(body('name'), { label: 'El nombre', required: false, min: 2, max: 40 }),
  body('isPublic').optional().isBoolean().withMessage('El campo "Mostrar en el Home" debe ser verdadero o falso.'),
  number(body('order'), { label: 'El orden', required: false, min: 0, integer: true }),
  text(body('description'), { label: 'La descripción', required: false, max: 500 }),
  body('images').optional().isArray().withMessage('Las fotos deben ser una lista.'),
  validate,
];

module.exports = { createInstrumentValidators, updateInstrumentValidators };
