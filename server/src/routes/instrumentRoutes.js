const Instrument = require('../models/Instrument');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');
const { createInstrumentValidators, updateInstrumentValidators } = require('../validators/instrumentValidators');

const base = createCrudController(Instrument);

// Instruments are shown in a curated order (set by the admin), not creation
// order or alphabetically — matches how they're meant to appear on the Home page.
async function list(req, res) {
  const docs = await Instrument.find().sort({ order: 1, name: 1 });
  res.json(docs);
}

module.exports = buildCrudRouter(
  { ...base, list },
  { create: createInstrumentValidators, update: updateInstrumentValidators }
);
