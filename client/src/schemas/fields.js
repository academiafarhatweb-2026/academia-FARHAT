import { z } from 'zod';

// Same patterns as server/src/validators/common.js — keep both in sync.
const PERSON_NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/;
const PHONE_RE = /^\+?[0-9 -]{6,20}$/;
const WHATSAPP_RE = /^[0-9]{8,15}$/;
// Backs up the loose native type="email" check with an explicit user@domain.tld shape.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

// All form inputs arrive as strings (native HTML inputs) — these helpers
// validate the string, one issue at a time in Spanish, and the numeric ones
// leave the actual Number() conversion to the caller at submit time.

export function textField({ required = true, min, max, pattern, patternMsg, label = 'Este campo' } = {}) {
  return z.string().superRefine((raw, ctx) => {
    const val = (raw ?? '').trim();
    if (required && val === '') {
      ctx.addIssue({ code: 'custom', message: `${label} es obligatorio.` });
      return;
    }
    if (val === '') return;
    if (min != null && val.length < min) {
      ctx.addIssue({ code: 'custom', message: `${label} debe tener al menos ${min} caracteres.` });
      return;
    }
    if (max != null && val.length > max) {
      ctx.addIssue({ code: 'custom', message: `${label} debe tener como máximo ${max} caracteres.` });
      return;
    }
    if (pattern && !pattern.test(val)) {
      ctx.addIssue({ code: 'custom', message: patternMsg || `${label} tiene un formato inválido.` });
    }
  });
}

export function personNameField({ required = true, min = 2, max = 80, label = 'El nombre' } = {}) {
  return textField({
    required,
    min,
    max,
    pattern: PERSON_NAME_RE,
    patternMsg: `${label} solo puede tener letras y espacios, sin números.`,
    label,
  });
}

export function emailField({ required = true, max = 100, label = 'El email' } = {}) {
  return textField({
    required,
    max,
    pattern: EMAIL_RE,
    patternMsg: 'Ingresá un email válido, ej: nombre@dominio.com',
    label,
  });
}

export function phoneField({ required = false, label = 'El teléfono' } = {}) {
  return textField({
    required,
    max: 20,
    pattern: PHONE_RE,
    patternMsg: `${label} solo puede tener números, espacios y guiones. Ej: +54 9 3812 07-8328`,
    label,
  });
}

export function whatsappField({ required = false, label = 'El número de WhatsApp' } = {}) {
  return textField({
    required,
    max: 15,
    pattern: WHATSAPP_RE,
    patternMsg: `${label} solo puede tener números, sin + ni espacios. Ej: 5493812078328`,
    label,
  });
}

export function urlField({ required = false, max = 200, label = 'El link' } = {}) {
  return textField({
    required,
    max,
    pattern: URL_RE,
    patternMsg: `${label} debe ser una URL válida (empieza con http:// o https://).`,
    label,
  });
}

export function numberField({ required = true, min = 0, max, integer = false, label = 'Este campo' } = {}) {
  return z.string().superRefine((raw, ctx) => {
    const val = (raw ?? '').toString().trim();
    if (required && val === '') {
      ctx.addIssue({ code: 'custom', message: `${label} es obligatorio.` });
      return;
    }
    if (!required && val === '') return;
    if (!/^-?\d+(\.\d+)?$/.test(val)) {
      ctx.addIssue({ code: 'custom', message: `${label} debe ser un número, sin letras.` });
      return;
    }
    const num = Number(val);
    if (num < 0) {
      ctx.addIssue({ code: 'custom', message: `${label} no puede ser un número negativo.` });
      return;
    }
    if (min != null && num < min) {
      ctx.addIssue({ code: 'custom', message: `${label} debe ser mayor o igual a ${min}.` });
      return;
    }
    if (max != null && num > max) {
      ctx.addIssue({ code: 'custom', message: `${label} debe ser menor o igual a ${max}.` });
      return;
    }
    if (integer && !Number.isInteger(num)) {
      ctx.addIssue({ code: 'custom', message: `${label} debe ser un número entero.` });
    }
  });
}

export function selectField({ label = 'Este campo' } = {}) {
  return z.string().min(1, `${label} es obligatorio.`);
}

export function dateField({ label = 'La fecha' } = {}) {
  return z.string().min(1, `${label} es obligatoria.`);
}
