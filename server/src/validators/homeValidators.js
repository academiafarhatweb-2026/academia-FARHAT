import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { text, phone, whatsapp, url } from './common.js';

export const homeContentValidators = [
  text(body('address'), { label: 'La dirección', required: false, max: 200 }),
  phone(body('phone'), { label: 'El teléfono', required: false }),
  whatsapp(body('whatsappNumber'), { label: 'El número de WhatsApp', required: false }),
  url(body('instagram'), { label: 'El link de Instagram', required: false }),
  url(body('facebook'), { label: 'El link de Facebook', required: false }),
  body('heroImages').optional().isArray().withMessage('Las imágenes deben ser una lista.'),
  validate,
];
