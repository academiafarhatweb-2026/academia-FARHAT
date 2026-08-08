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

export const teacherRateSchema = z.object({
  instrument: selectField({ label: 'El instrumento' }),
  percentage: numberField({ min: 0, max: 100, label: 'La comisión' }),
});

export const teacherSchema = z.object({
  name: personNameField({ label: 'El nombre' }),
  phone: phoneField({ label: 'El teléfono' }),
  email: emailField({ required: false, label: 'El email' }),
  rates: z.array(teacherRateSchema),
});

export const classSlotSchema = z
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
