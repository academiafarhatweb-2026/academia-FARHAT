const HomeContent = require('../models/HomeContent');
const Instrument = require('../models/Instrument');
const FixedClass = require('../models/FixedClass');

async function buildPublicPayload(content) {
  const publicInstruments = await Instrument.find({ isPublic: true }).sort({ name: 1 });
  const publicInstrumentIds = new Set(publicInstruments.map((i) => i._id.toString()));

  const classes = await FixedClass.find({ active: true }).populate('instrument').populate('teacher');
  const schedule = classes
    .filter((c) => publicInstrumentIds.has(c.instrument._id.toString()))
    .map((c) => ({
      instrumentId: c.instrument._id,
      instrumentName: c.instrument.name,
      teacherName: c.teacher.name,
      slots: c.slots,
    }));

  return { ...content.toObject(), publicInstruments, schedule };
}

async function getContent(req, res) {
  let content = await HomeContent.findOne();
  if (!content) content = await HomeContent.create({});
  res.json(await buildPublicPayload(content));
}

async function updateContent(req, res) {
  let content = await HomeContent.findOne();
  if (!content) content = new HomeContent();

  Object.assign(content, req.body);
  await content.save();

  res.json(await buildPublicPayload(content));
}

module.exports = { getContent, updateContent };
