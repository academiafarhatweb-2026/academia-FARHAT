import Instrument from '../models/Instrument.js';
import createCrudController from '../controllers/crudFactory.js';
import buildCrudRouter from '../utils/crudRouter.js';
import {
  createInstrumentValidators,
  updateInstrumentValidators,
} from '../validators/instrumentValidators.js';

const base = createCrudController(Instrument);

// Instruments are shown in a curated order (set by the admin), not creation
// order or alphabetically — matches how they're meant to appear on the Home page.
async function list(req, res) {
  const docs = await Instrument.find().sort({ order: 1, name: 1 });
  res.json(docs);
}

export default buildCrudRouter(
  { ...base, list },
  { create: createInstrumentValidators, update: updateInstrumentValidators }
);
