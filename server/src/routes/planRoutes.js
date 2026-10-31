import Plan from '../models/Plan.js';
import createCrudController from '../controllers/crudFactory.js';
import buildCrudRouter from '../utils/crudRouter.js';
import { planValidators } from '../validators/planValidators.js';

export default buildCrudRouter(createCrudController(Plan), { create: planValidators, update: planValidators });
