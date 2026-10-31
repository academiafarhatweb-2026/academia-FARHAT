import HomeContent from '../models/HomeContent.js';
import Instrument from '../models/Instrument.js';
import FixedClass from '../models/FixedClass.js';

async function buildPublicPayload(content) {
  const publicInstruments = await Instrument.find({ isPublic: true })
    .select('name description images order')
    .sort({ order: 1, name: 1 });
  const publicInstrumentIds = new Set(publicInstruments.map((i) => i._id.toString()));

  // Public endpoint: only the teacher's name, never their contact info or rates.
  const classes = await FixedClass.find({ active: true })
    .populate({ path: 'instrument', select: 'name' })
    .populate({ path: 'teacher', select: 'name' });
  const schedule = classes
    // A class can end up with a dangling instrument/teacher reference if that
    // catalog entry was deleted without deactivating the class — skip those
    // instead of crashing the whole Home payload.
    .filter((c) => c.instrument && c.teacher && publicInstrumentIds.has(c.instrument._id.toString()))
    .map((c) => ({
      instrumentId: c.instrument._id,
      instrumentName: c.instrument.name,
      teacherName: c.teacher.name,
      slots: c.slots,
    }));

  return { ...content.toObject(), publicInstruments, schedule };
}

export async function getContent(req, res) {
  let content = await HomeContent.findOne();
  if (!content) content = await HomeContent.create({});
  // Cached at Vercel's edge for a minute (and served stale while refreshing),
  // so most visits never wait for a cold serverless start + MongoDB connection.
  res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  res.json(await buildPublicPayload(content));
}

export async function updateContent(req, res) {
  let content = await HomeContent.findOne();
  if (!content) content = new HomeContent();

  const { heroImages, address, phone, whatsappNumber, instagram, facebook } = req.body;
  Object.entries({ heroImages, address, phone, whatsappNumber, instagram, facebook }).forEach(([key, value]) => {
    if (value !== undefined) content[key] = value;
  });
  await content.save();

  res.json(await buildPublicPayload(content));
}
