import Teacher from '../models/Teacher.js';
import Settlement from '../models/Settlement.js';
import createCrudController from '../controllers/crudFactory.js';
import buildCrudRouter from '../utils/crudRouter.js';
import { teacherValidators } from '../validators/teacherValidators.js';

const base = createCrudController(Teacher, ['rates.instrument']);

// A settlement only makes sense tied to its teacher — leaving it behind as a
// dangling "Profesor eliminado" row is more confusing than useful, so it goes
// with the teacher instead of lingering in the settlements history.
async function remove(req, res) {
  const doc = await Teacher.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'No encontrado' });
  await Settlement.deleteMany({ teacher: req.params.id });
  res.json({ message: 'Eliminado' });
}

export default buildCrudRouter(
  { ...base, remove },
  { create: teacherValidators, update: teacherValidators }
);
