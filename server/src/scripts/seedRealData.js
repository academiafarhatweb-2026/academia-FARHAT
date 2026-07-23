// Loads the real catalog data supplied by the academy (instruments, teachers with their
// per-instrument commission %, weekly fixed-class schedule, and pricing plans) from
// "CLASES 11.pdf", the "Clases" screenshots, and "Liquidacion Hernan.pdf".
require('dotenv').config();
const connectDB = require('../config/db');
const Instrument = require('../models/Instrument');
const Teacher = require('../models/Teacher');
const FixedClass = require('../models/FixedClass');
const Plan = require('../models/Plan');

const DAY = { LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6 };

// Full catalog advertised by the academy (original scope), plus the ones that appear
// in the real schedule data.
const INSTRUMENT_NAMES = [
  'GUITARRA',
  'BATERIA',
  'TECLADO',
  'VIOLIN',
  'CANTO',
  'GUITARRA ELECTRICA',
  'UKELELE',
  'BAJO',
];

// From "CLASES 11.pdf" (rendered table) + the "Clases" screenshots (which additionally
// show a Sabado 11-13 Bateria slot for Hernan Ruiz and a teacher, Anabella Rosario Soria,
// teaching Canto that isn't listed in the PDF).
const TEACHERS = [
  {
    name: 'Hernan Ruiz',
    rates: [
      { instrument: 'GUITARRA', percentage: 40 },
      { instrument: 'BATERIA', percentage: 45 },
    ],
    classes: [
      { instrument: 'GUITARRA', day: 'LUNES', startHour: 17 },
      { instrument: 'GUITARRA', day: 'LUNES', startHour: 19 },
      { instrument: 'GUITARRA', day: 'MIERCOLES', startHour: 15 },
      { instrument: 'GUITARRA', day: 'JUEVES', startHour: 17 },
      { instrument: 'GUITARRA', day: 'JUEVES', startHour: 19 },
      { instrument: 'GUITARRA', day: 'VIERNES', startHour: 19 },
      { instrument: 'BATERIA', day: 'MARTES', startHour: 17 },
      { instrument: 'BATERIA', day: 'MARTES', startHour: 19 },
      { instrument: 'BATERIA', day: 'MIERCOLES', startHour: 17 },
      { instrument: 'BATERIA', day: 'MIERCOLES', startHour: 19 },
      { instrument: 'BATERIA', day: 'VIERNES', startHour: 17 },
      { instrument: 'BATERIA', day: 'SABADO', startHour: 11 }, // visto en la captura, no en el PDF
    ],
  },
  {
    name: 'Juan Elsinger',
    rates: [{ instrument: 'TECLADO', percentage: 35 }],
    classes: [
      { instrument: 'TECLADO', day: 'LUNES', startHour: 19 },
      { instrument: 'TECLADO', day: 'MIERCOLES', startHour: 19 },
    ],
  },
  {
    name: 'Jason Alvarez',
    rates: [{ instrument: 'TECLADO', percentage: 35 }],
    classes: [
      { instrument: 'TECLADO', day: 'JUEVES', startHour: 17 },
      { instrument: 'TECLADO', day: 'JUEVES', startHour: 19 },
      { instrument: 'TECLADO', day: 'VIERNES', startHour: 17 },
      { instrument: 'TECLADO', day: 'VIERNES', startHour: 19 },
    ],
  },
  {
    name: 'Luciano Valdez',
    rates: [{ instrument: 'GUITARRA', percentage: 35 }],
    classes: [
      { instrument: 'GUITARRA', day: 'JUEVES', startHour: 17 },
      { instrument: 'GUITARRA', day: 'JUEVES', startHour: 19 },
      { instrument: 'GUITARRA', day: 'VIERNES', startHour: 17 },
      { instrument: 'GUITARRA', day: 'VIERNES', startHour: 19 },
    ],
  },
  {
    name: 'Lourdes Villalba',
    rates: [{ instrument: 'GUITARRA', percentage: 35 }],
    classes: [
      { instrument: 'GUITARRA', day: 'MIERCOLES', startHour: 19 },
      { instrument: 'GUITARRA', day: 'SABADO', startHour: 11 },
    ],
  },
  {
    name: 'Lourdes Ahumada',
    rates: [{ instrument: 'VIOLIN', percentage: 35 }],
    classes: [
      { instrument: 'VIOLIN', day: 'VIERNES', startHour: 17 },
      { instrument: 'VIOLIN', day: 'VIERNES', startHour: 19 },
      { instrument: 'VIOLIN', day: 'SABADO', startHour: 11 },
    ],
  },
  {
    name: 'Angel Rodriguez',
    rates: [{ instrument: 'GUITARRA', percentage: 40 }],
    classes: [{ instrument: 'GUITARRA', day: 'VIERNES', startHour: 19 }],
  },
  {
    name: 'Sofia Fernandez',
    rates: [{ instrument: 'CANTO', percentage: 35 }],
    classes: [
      { instrument: 'CANTO', day: 'LUNES', startHour: 19 },
      { instrument: 'CANTO', day: 'MIERCOLES', startHour: 19 },
      { instrument: 'CANTO', day: 'VIERNES', startHour: 17 },
      { instrument: 'CANTO', day: 'VIERNES', startHour: 19 },
      { instrument: 'CANTO', day: 'SABADO', startHour: 11 },
    ],
  },
  {
    name: 'Jhonatan Penaloza',
    rates: [{ instrument: 'CANTO', percentage: 40 }],
    classes: [
      { instrument: 'CANTO', day: 'MIERCOLES', startHour: 17 },
      { instrument: 'CANTO', day: 'MIERCOLES', startHour: 19 },
      { instrument: 'CANTO', day: 'JUEVES', startHour: 19 },
      { instrument: 'CANTO', day: 'SABADO', startHour: 11 },
    ],
  },
  {
    // Visto en la captura de "Clases" (lista real), no aparece en CLASES 11.pdf.
    // % de comision no especificado en ninguna fuente: se carga 35% (igual que el otro
    // profesor de Canto) como valor por defecto -- CONFIRMAR con el usuario y ajustar si corresponde.
    name: 'Anabella Rosario Soria',
    rates: [{ instrument: 'CANTO', percentage: 35 }],
    classes: [
      { instrument: 'CANTO', day: 'LUNES', startHour: 19 },
      { instrument: 'CANTO', day: 'MIERCOLES', startHour: 19 },
      { instrument: 'CANTO', day: 'SABADO', startHour: 9 },
    ],
  },
];

// De "Liquidacion Hernan.pdf": PROMO 1 = 45000/4 clases, PROMO 2 = 39000/4 clases (descuento),
// XCLASE = 15000 por clase suelta (classesIncluded = 1).
const PLANS = [
  { name: 'Promo 1', value: 45000, classesIncluded: 4 },
  { name: 'Promo 2', value: 39000, classesIncluded: 4 },
  { name: 'XCLASE', value: 15000, classesIncluded: 1 },
];

async function run() {
  await connectDB();

  const instrumentByName = {};
  for (const name of INSTRUMENT_NAMES) {
    const doc = await Instrument.findOneAndUpdate(
      { name },
      { name, isPublic: true },
      { new: true, upsert: true }
    );
    instrumentByName[name] = doc;
  }
  console.log(`Instrumentos: ${INSTRUMENT_NAMES.length}`);

  let classCount = 0;
  for (const t of TEACHERS) {
    const rates = t.rates.map((r) => ({
      instrument: instrumentByName[r.instrument]._id,
      percentage: r.percentage,
    }));

    const teacherDoc = await Teacher.findOneAndUpdate(
      { name: t.name },
      { name: t.name, rates },
      { new: true, upsert: true }
    );

    for (const c of t.classes) {
      const instrumentId = instrumentByName[c.instrument]._id;
      const day = DAY[c.day];
      const startHour = c.startHour;
      const endHour = startHour + 2;

      const existing = await FixedClass.findOne({
        teacher: teacherDoc._id,
        instrument: instrumentId,
        'slots.day': day,
        'slots.startHour': startHour,
      });

      if (!existing) {
        await FixedClass.create({
          teacher: teacherDoc._id,
          instrument: instrumentId,
          slots: [{ day, startHour, endHour }],
        });
        classCount += 1;
      }
    }
  }
  console.log(`Profesores: ${TEACHERS.length}, clases fijas nuevas: ${classCount}`);

  for (const p of PLANS) {
    await Plan.findOneAndUpdate({ name: p.name }, p, { new: true, upsert: true });
  }
  console.log(`Planes: ${PLANS.length}`);

  console.log('Listo.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
