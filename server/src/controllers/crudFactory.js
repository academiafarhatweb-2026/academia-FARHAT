// Generic CRUD handlers shared by simple catalog resources (Instrument, Teacher, Plan, FixedClass).
function createCrudController(Model, populate = []) {
  return {
    async list(req, res) {
      let query = Model.find();
      populate.forEach((p) => (query = query.populate(p)));
      const docs = await query.sort({ createdAt: -1 });
      res.json(docs);
    },

    async getOne(req, res) {
      let query = Model.findById(req.params.id);
      populate.forEach((p) => (query = query.populate(p)));
      const doc = await query;
      if (!doc) return res.status(404).json({ message: 'No encontrado' });
      res.json(doc);
    },

    async create(req, res) {
      const doc = await Model.create(req.body);
      res.status(201).json(doc);
    },

    async update(req, res) {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ message: 'No encontrado' });
      res.json(doc);
    },

    async remove(req, res) {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'No encontrado' });
      res.json({ message: 'Eliminado' });
    },
  };
}

module.exports = createCrudController;
