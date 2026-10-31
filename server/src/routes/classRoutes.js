import FixedClass from '../models/FixedClass.js';
import createCrudController from '../controllers/crudFactory.js';
import buildCrudRouter from '../utils/crudRouter.js';
import { classValidators } from '../validators/classValidators.js';

export default buildCrudRouter(createCrudController(FixedClass, ['instrument', 'teacher']), {
  create: classValidators,
  update: classValidators,
});
