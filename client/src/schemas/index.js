import { z } from 'zod';
import {
  personNameField,
  emailField,
  phoneField,
  whatsappField,
  urlField,
  numberField,
  selectField,
  dateField,
  textField,
} from './fields';
import { MAX_PRODUCT_IMAGES, PAYMENT_METHODS, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from '../utils/products';
import { todayISO } from '../utils/dates';

export const studentSchema = z.object({
  name: personNameField({ label: 'El nombre' }),
  email: emailField({ label: 'El email' }),
  phone: phoneField({ label: 'El teléfono' }),
  active: z.boolean(),
});

export const instrumentSchema = z.object({
  name: textField({ min: 2, max: 40, label: 'El nombre' }),
  order: numberField({ required: false, min: 0, integer: true, label: 'El orden' }),
  isPublic: z.boolean(),
});

export const planSchema = z.object({
  name: textField({ min: 2, max: 40, label: 'El nombre' }),
  value: numberField({ min: 0, label: 'El valor' }),
  classesIncluded: numberField({ min: 1, integer: true, label: 'La cantidad de clases incluidas' }),
});

const teacherRateSchema = z.object({
  instrument: selectField({ label: 'El instrumento' }),
  percentage: numberField({ min: 0, max: 100, label: 'La comisión' }),
});

export const teacherSchema = z.object({
  name: personNameField({ label: 'El nombre' }),
  phone: phoneField({ label: 'El teléfono' }),
  email: emailField({ required: false, label: 'El email' }),
  rates: z.array(teacherRateSchema),
});

const classSlotSchema = z
  .object({
    day: numberField({ min: 0, max: 6, integer: true, label: 'El día' }),
    startHour: numberField({ min: 0, max: 23, integer: true, label: 'La hora de inicio' }),
    endHour: numberField({ min: 0, max: 23, integer: true, label: 'La hora de fin' }),
  })
  .superRefine((slot, ctx) => {
    if (slot.startHour !== '' && slot.endHour !== '' && Number(slot.endHour) <= Number(slot.startHour)) {
      ctx.addIssue({ code: 'custom', message: 'La hora de fin debe ser posterior a la hora de inicio.', path: ['endHour'] });
    }
  });

export const classFormSchema = z.object({
  instrument: selectField({ label: 'El instrumento' }),
  teacher: selectField({ label: 'El profesor' }),
  slots: z.array(classSlotSchema).min(1, 'Agregá al menos un horario.'),
});

export const enrollmentSchema = z.object({
  student: selectField({ label: 'El alumno' }),
  plan: selectField({ label: 'El precio' }),
  customValue: numberField({ min: 0, label: 'El precio' }),
  enrollmentDate: dateField({ label: 'La fecha de inscripción' }),
  classes: z.array(z.string()).min(1, 'Agregá al menos una clase.'),
});

export const paymentCreateSchema = z.object({
  enrollmentId: selectField({ label: 'La inscripción' }),
  classesCount: numberField({ min: 1, integer: true, label: 'La cantidad de clases' }),
  amount: numberField({ required: false, min: 0, label: 'El monto' }),
});

export const paymentEditSchema = z.object({
  amount: numberField({ min: 0, label: 'El monto' }),
  classesCount: numberField({ min: 1, integer: true, label: 'La cantidad de clases' }),
});

export const settlementGenerateSchema = z.object({
  teacherId: selectField({ label: 'El profesor' }),
  periodMonth: numberField({ min: 1, max: 12, integer: true, label: 'El mes' }),
  periodYear: numberField({ min: 2000, max: 2100, integer: true, label: 'El año' }),
});

export const settlementLineEditSchema = z.object({
  value: numberField({ min: 0, label: 'El valor' }),
  percentage: numberField({ min: 0, max: 100, label: 'El porcentaje' }),
  pricePerClass: numberField({ min: 0, label: 'El precio por clase' }),
  classesCount: numberField({ min: 0, integer: true, label: 'La cantidad de clases' }),
});

export const settlementIdentityEditSchema = z.object({
  teacherId: selectField({ label: 'El profesor' }),
  periodMonth: numberField({ min: 1, max: 12, integer: true, label: 'El mes' }),
  periodYear: numberField({ min: 2000, max: 2100, integer: true, label: 'El año' }),
});

export const homeContentSchema = z.object({
  address: textField({ required: false, max: 200, label: 'La dirección' }),
  phone: phoneField({ label: 'El teléfono' }),
  whatsappNumber: whatsappField({ label: 'El número de WhatsApp' }),
  instagram: urlField({ label: 'El link de Instagram' }),
  facebook: urlField({ label: 'El link de Facebook' }),
});

export const adminLoginSchema = z.object({
  email: emailField({ label: 'El email' }),
  password: textField({ min: 6, max: 100, label: 'La contraseña' }),
});

export const studentLoginSchema = z.object({
  email: emailField({ label: 'El email' }),
});

// A photo in the form: already saved ({ url }) or just picked ({ file }).
const productPhotoSchema = z
  .object({ key: z.string(), url: z.string().optional(), file: z.instanceof(File).optional(), preview: z.string().optional() })
  .superRefine((photo, ctx) => {
    if (!photo.file) return;
    if (!PRODUCT_IMAGE_TYPES.includes(photo.file.type)) {
      ctx.addIssue({ code: 'custom', message: 'Las fotos deben ser JPG, PNG o WEBP.' });
    } else if (photo.file.size > PRODUCT_IMAGE_MAX_BYTES) {
      ctx.addIssue({ code: 'custom', message: 'Cada foto puede pesar como máximo 2 MB.' });
    }
  });

// One schema for both "Nuevo" and "Modificar".
export const productSchema = z.object({
  name: textField({ min: 2, max: 100, label: 'El nombre' }),
  brand: textField({ required: false, max: 60, label: 'La marca' }),
  model: textField({ required: false, max: 60, label: 'El modelo' }),
  category: z
    .string()
    .trim()
    .min(1, 'La categoría es obligatoria.')
    .min(2, 'La categoría debe tener al menos 2 caracteres.')
    .max(40, 'La categoría debe tener como máximo 40 caracteres.'),
  condition: z.enum(['new', 'used'], { message: 'El estado es obligatorio.' }),
  description: textField({ required: false, max: 300, label: 'La descripción' }),
  price: numberField({ label: 'El precio' }).refine((v) => v.trim() === '' || Number(v) > 0, {
    message: 'El precio debe ser mayor a 0.',
  }),
  discount: numberField({ required: false, min: 0, max: 100, label: 'El descuento' }),
  promotion: textField({ required: false, max: 80, label: 'La promoción' }),
  paymentMethods: z.array(z.enum(PAYMENT_METHODS)).min(1, 'Elegí al menos un medio de pago.'),
  stock: numberField({ min: 0, integer: true, label: 'El stock actual' }),
  minStock: numberField({ min: 0, integer: true, label: 'El stock mínimo' }),
  order: numberField({ min: 1, integer: true, label: 'El orden' }),
  active: z.boolean(),
  // In display order: the first one is the main photo.
  photos: z
    .array(productPhotoSchema)
    .min(1, 'Agregá al menos una foto.')
    .max(MAX_PRODUCT_IMAGES, `Podés cargar hasta ${MAX_PRODUCT_IMAGES} fotos.`),
});

// Built per product: the quantity can't exceed what's in stock right now.
export function saleSchema(maxQuantity) {
  const stockMessage = maxQuantity === 1 ? 'Solo queda 1 unidad en stock.' : `Solo hay ${maxQuantity} unidades en stock.`;
  return z.object({
    quantity: numberField({ min: 1, integer: true, label: 'La cantidad' }).refine(
      (v) => v.trim() === '' || Number(v) <= maxQuantity,
      { message: stockMessage }
    ),
    unitPrice: numberField({ label: 'El precio por unidad' }).refine((v) => v.trim() === '' || Number(v) > 0, {
      message: 'El precio por unidad debe ser mayor a 0.',
    }),
    // "YYYY-MM-DD" strings compare correctly as text
    soldAt: dateField({ label: 'La fecha de venta' }).refine((v) => v <= todayISO(), {
      message: 'La fecha de venta no puede ser futura.',
    }),
    paymentMethod: z.string(),
    note: textField({ required: false, max: 200, label: 'La nota' }),
  });
}
