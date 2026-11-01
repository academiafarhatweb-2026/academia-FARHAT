import Product from '../models/Product.js';
import { DEFAULT_PRODUCT_CATEGORIES } from '../constants/products.js';
import { destroyImage } from '../utils/cloudinaryAsset.js';
import HttpError from '../utils/httpError.js';

const EDITABLE_FIELDS = [
  'name', 'brand', 'model', 'category', 'condition', 'description', 'image', 'price',
  'discount', 'promotion', 'paymentMethods', 'stock', 'minStock', 'order', 'active',
];

// Only known fields reach the database, already in their real types (the
// validators have checked them; forms send numbers as strings).
function pickProductData(body) {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  for (const field of ['price', 'stock', 'minStock', 'order']) {
    if (data[field] !== undefined) data[field] = Number(data[field]);
  }
  if (data.discount !== undefined) data.discount = data.discount === '' ? 0 : Number(data.discount);
  if (data.image === '') delete data.image; // edit without a new photo keeps the current one
  if (Array.isArray(data.paymentMethods)) data.paymentMethods = [...new Set(data.paymentMethods)];
  return data;
}

// Categories are typed freely. To avoid "Guitarras" and "guitarras" living
// side by side, a name matching an existing category (ignoring case, accents and extra
// spaces) reuses that spelling; a brand-new one starts with a capital letter.
async function normalizeCategory(raw) {
  const name = raw.trim().replace(/\s+/g, ' ');
  const existing = await Product.distinct('category');
  const match = existing.find((c) => c.localeCompare(name, 'es', { sensitivity: 'base' }) === 0);
  return match || name.charAt(0).toLocaleUpperCase('es') + name.slice(1);
}

async function productDataFrom(body) {
  const data = pickProductData(body);
  if (data.category !== undefined) data.category = await normalizeCategory(data.category);
  return data;
}

// Keeps the display order as 1..n with no gaps or ties. `placedId` is the
// product just created/edited: it takes the position it asked for and the
// others shift around it (like inserting into a list).
async function renumberOrder(placedId, requestedOrder) {
  const products = await Product.find().select('_id order').sort({ order: 1, name: 1 });
  const currentOrder = new Map(products.map((p) => [p._id.toString(), p.order]));
  let ids = [...currentOrder.keys()];

  if (placedId) {
    const placed = placedId.toString();
    ids = ids.filter((id) => id !== placed);
    ids.splice(Math.min(Math.max(requestedOrder - 1, 0), ids.length), 0, placed);
  }

  const ops = ids
    .map((id, index) => ({ id, order: index + 1 }))
    .filter(({ id, order }) => currentOrder.get(id) !== order)
    .map(({ id, order }) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } }));
  if (ops.length > 0) await Product.bulkWrite(ops);
}

function listAll() {
  return Product.find().sort({ order: 1, name: 1 });
}

export async function list(req, res) {
  res.json(await listAll());
}

export async function getOne(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  res.json(product);
}

export async function create(req, res) {
  const product = await Product.create(await productDataFrom(req.body));
  await renumberOrder(product._id, product.order);
  res.status(201).json(await Product.findById(product._id));
}

export async function update(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Producto no encontrado');

  const previousImage = product.image;
  product.set(await productDataFrom(req.body));
  await product.save();
  if (product.image !== previousImage) await destroyImage(previousImage);
  await renumberOrder(product._id, product.order);

  res.json(await Product.findById(product._id));
}

export async function remove(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  await destroyImage(product.image);
  await renumberOrder();
  res.json({ message: 'Eliminado' });
}

// +/- from the stock table. The "never below 0" rule is part of the update
// itself, so two quick clicks (or two admins) can't race the stock negative.
export async function adjustStock(req, res) {
  const delta = Number(req.body.delta);
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, stock: { $gte: -delta } },
    { $inc: { stock: delta } },
    { new: true }
  );

  if (product) return res.json(product);
  if (!(await Product.exists({ _id: req.params.id }))) throw new HttpError(404, 'Producto no encontrado');
  throw new HttpError(400, 'El stock no puede quedar por debajo de 0.');
}

// Receives every product id in its new position (drag & drop in the panel).
export async function reorder(req, res) {
  const { ids } = req.body;
  if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Hay productos repetidos en el orden.');

  await Product.bulkWrite(
    ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index + 1 } } } }))
  );
  res.json(await listAll());
}

// Suggestions for the category field: the ones already in use plus a few
// common examples (which only become real once a product uses them).
export async function listCategories(req, res) {
  const used = await Product.distinct('category');
  const suggestions = [...used];
  for (const example of DEFAULT_PRODUCT_CATEGORIES) {
    if (!used.some((c) => c.localeCompare(example, 'es', { sensitivity: 'base' }) === 0)) suggestions.push(example);
  }
  res.json(suggestions.sort((a, b) => a.localeCompare(b, 'es')));
}

// What the public Home gets: active products only, and whether they're in
// stock — never the actual quantities or alert thresholds.
export async function listPublicProducts() {
  const products = await Product.find({ active: true }).sort({ order: 1, name: 1 });

  const publicProducts = products.map((p) => ({
    _id: p._id,
    name: p.name,
    brand: p.brand,
    model: p.model,
    category: p.category,
    condition: p.condition,
    description: p.description,
    image: p.image,
    price: p.price,
    discount: p.discount,
    finalPrice: p.finalPrice,
    promotion: p.promotion,
    paymentMethods: p.paymentMethods,
    inStock: p.stock > 0,
  }));

  // Out-of-stock products stay visible (labelled), but after everything that
  // can actually be bought; each group keeps the admin's configured order.
  return [...publicProducts.filter((p) => p.inStock), ...publicProducts.filter((p) => !p.inStock)];
}
