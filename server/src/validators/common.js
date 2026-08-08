// Shared regex + field builders for express-validator chains — mirrors the
// client-side rules in client/src/schemas so both sides agree on what's valid.

const PERSON_NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/;
const PHONE_RE = /^\+?[0-9 -]{6,20}$/;
const WHATSAPP_RE = /^[0-9]{8,15}$/;
const URL_RE = /^https?:\/\/.+/i;

function personName(chain, { label = 'El nombre', required = true } = {}) {
  let c = chain.trim();
  c = required ? c.notEmpty().withMessage(`${label} es obligatorio.`) : c.optional({ checkFalsy: true });
  return c
    .isLength({ min: 2, max: 80 })
    .withMessage(`${label} debe tener entre 2 y 80 caracteres.`)
    .matches(PERSON_NAME_RE)
    .withMessage(`${label} solo puede tener letras y espacios, sin números.`);
}

function phone(chain, { label = 'El teléfono', required = false } = {}) {
  let c = chain.trim();
  c = required ? c.notEmpty().withMessage(`${label} es obligatorio.`) : c.optional({ checkFalsy: true });
  return c
    .isLength({ max: 20 })
    .withMessage(`${label} debe tener como máximo 20 caracteres.`)
    .matches(PHONE_RE)
    .withMessage(`${label} solo puede tener números, espacios y guiones. Ej: +54 9 3812 07-8328`);
}

function whatsapp(chain, { label = 'El número de WhatsApp', required = false } = {}) {
  let c = chain.trim();
  c = required ? c.notEmpty().withMessage(`${label} es obligatorio.`) : c.optional({ checkFalsy: true });
  return c
    .isLength({ max: 15 })
    .withMessage(`${label} debe tener como máximo 15 caracteres.`)
    .matches(WHATSAPP_RE)
    .withMessage(`${label} solo puede tener números, sin + ni espacios. Ej: 5493812078328`);
}

function email(chain, { label = 'El email', required = true, max = 100 } = {}) {
  let c = chain.trim();
  c = required ? c.notEmpty().withMessage(`${label} es obligatorio.`) : c.optional({ checkFalsy: true });
  return c
    .isEmail()
    .withMessage('Ingresá un email válido, ej: nombre@dominio.com')
    .isLength({ max })
    .withMessage(`${label} debe tener como máximo ${max} caracteres.`);
}

function url(chain, { label = 'El link', required = false, max = 200 } = {}) {
  let c = chain.trim();
  c = required ? c.notEmpty().withMessage(`${label} es obligatorio.`) : c.optional({ checkFalsy: true });
  return c
    .isLength({ max })
    .withMessage(`${label} debe tener como máximo ${max} caracteres.`)
    .matches(URL_RE)
    .withMessage(`${label} debe ser una URL válida (empieza con http:// o https://).`);
}

function text(chain, { label = 'Este campo', required = true, min, max } = {}) {
  let c = chain.trim();
  c = required ? c.notEmpty().withMessage(`${label} es obligatorio.`) : c.optional({ checkFalsy: true });
  if (min != null) c = c.isLength({ min }).withMessage(`${label} debe tener al menos ${min} caracteres.`);
  if (max != null) c = c.isLength({ max }).withMessage(`${label} debe tener como máximo ${max} caracteres.`);
  return c;
}

// A numeric field: required, non-negative by default, no letters allowed
// (isFloat/isInt already reject non-numeric strings on their own).
function number(chain, { label = 'Este campo', required = true, min = 0, max, integer = false } = {}) {
  let c = required ? chain.notEmpty().withMessage(`${label} es obligatorio.`) : chain.optional({ checkFalsy: true });
  const validator = integer ? 'isInt' : 'isFloat';
  const opts = {};
  if (min != null) opts.min = min;
  if (max != null) opts.max = max;
  c = c[validator](opts).withMessage(() => {
    if (min === 0 && max == null) return `${label} debe ser un número${integer ? ' entero' : ''}, no puede ser negativo.`;
    if (max != null) return `${label} debe ser un número entre ${min} y ${max}.`;
    return `${label} debe ser un número válido.`;
  });
  return c;
}

module.exports = { PERSON_NAME_RE, PHONE_RE, WHATSAPP_RE, URL_RE, personName, phone, whatsapp, email, url, text, number };
