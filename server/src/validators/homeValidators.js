const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { text, phone, whatsapp, url } = require('./common');

const homeContentValidators = [
  text(body('address'), { label: 'La dirección', required: false, max: 200 }),
  phone(body('phone'), { label: 'El teléfono', required: false }),
  whatsapp(body('whatsappNumber'), { label: 'El número de WhatsApp', required: false }),
  url(body('instagram'), { label: 'El link de Instagram', required: false }),
  url(body('facebook'), { label: 'El link de Facebook', required: false }),
  body('heroImages').optional().isArray().withMessage('Las imágenes deben ser una lista.'),
  validate,
];

module.exports = { homeContentValidators };
