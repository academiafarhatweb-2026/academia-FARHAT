// Shared client-side validation patterns/messages for admin forms.

// Person names (alumno, profesor): letters only, no digits.
export const PERSON_NAME_PATTERN = "^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$";
export const PERSON_NAME_TITLE = 'Solo letras y espacios, sin números';

// Phone shown publicly, e.g. "+54 9 3812 07-8328".
export const PHONE_PATTERN = "^\\+?[0-9 -]{6,20}$";
export const PHONE_TITLE = 'Solo números, espacios y guiones. Ej: +54 9 3812 07-8328';
export const PHONE_MAXLENGTH = 20;

// WhatsApp number used to build a wa.me link: digits only, no + or spaces.
export const WHATSAPP_PATTERN = '^[0-9]{8,15}$';
export const WHATSAPP_TITLE = 'Solo números, sin + ni espacios. Ej: 5493812078328';
export const WHATSAPP_MAXLENGTH = 15;

// Backs up the native type="email" check (which some browsers apply loosely)
// with an explicit user@domain.tld shape.
export const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
export const EMAIL_TITLE = 'Ingresa un email válido, ej: nombre@dominio.com';
