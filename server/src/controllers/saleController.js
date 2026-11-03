import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import HttpError from '../utils/httpError.js';
import { startOfDay, startOfNextDay, toISODate, todayISO } from '../utils/dates.js';

// What the sales list needs from the current product: its stock (to know how
// many more units an edit could add) and what it looks like. Null if deleted.
const PRODUCT_FIELDS = 'stock image paymentMethods';

// A sale dated today keeps the real time (so same-day sales stay in order);
// a past date is stored at midday, safely inside that day in any time zone.
function saleDate(iso) {
  if (!iso || iso === todayISO()) return new Date();
  const date = startOfDay(iso);
  date.setHours(12);
  return date;
}

const roundMoney = (value) => Math.round(value * 100) / 100;

// Takes `quantity` units out of stock, or fails without touching anything.
// The stock check is part of the update itself, so two sales (or edits) at
// once can never sell more than there is.
async function takeFromStock(productId, quantity) {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );
  if (product) return product;

  const existing = await Product.findById(productId).select('stock');
  if (!existing) throw new HttpError(404, 'Producto no encontrado');
  const left = existing.stock === 1 ? 'queda 1 unidad' : `quedan ${existing.stock} unidades`;
  throw new HttpError(400, `No hay stock suficiente: ${left}.`);
}

function returnToStock(productId, quantity) {
  return Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
}

export async function list(req, res) {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.soldAt = {};
    if (from) filter.soldAt.$gte = startOfDay(from);
    if (to) filter.soldAt.$lt = startOfNextDay(to);
  }
  res.json(await Sale.find(filter).populate('product', PRODUCT_FIELDS).sort({ soldAt: -1, createdAt: -1 }));
}

export async function create(req, res) {
  const quantity = Number(req.body.quantity);
  const unitPrice = Number(req.body.unitPrice);
  const product = await takeFromStock(req.body.productId, quantity);

  try {
    const sale = await Sale.create({
      product: product._id,
      productName: product.name,
      productBrand: product.brand,
      productModel: product.model,
      productCategory: product.category,
      quantity,
      unitPrice,
      total: roundMoney(quantity * unitPrice),
      paymentMethod: req.body.paymentMethod || '',
      note: req.body.note || '',
      soldAt: saleDate(req.body.soldAt),
    });
    res.status(201).json({ sale, product });
  } catch (err) {
    // The sale couldn't be recorded: put the units back so stock stays true.
    await returnToStock(product._id, quantity);
    throw err;
  }
}

// Corrects a sale. A different quantity moves the difference in or out of
// stock (if the product still exists); the product itself never changes.
export async function update(req, res) {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw new HttpError(404, 'Venta no encontrada');

  const quantity = Number(req.body.quantity);
  const unitPrice = Number(req.body.unitPrice);
  const extraUnits = quantity - sale.quantity; // > 0: more units leave stock
  const productExists = Boolean(await Product.exists({ _id: sale.product }));

  if (productExists && extraUnits > 0) await takeFromStock(sale.product, extraUnits);
  if (productExists && extraUnits < 0) await returnToStock(sale.product, -extraUnits);

  try {
    sale.set({
      quantity,
      unitPrice,
      total: roundMoney(quantity * unitPrice),
      paymentMethod: req.body.paymentMethod || '',
      note: req.body.note || '',
    });
    // Same day as before: keep the original time instead of resetting it.
    if (req.body.soldAt && req.body.soldAt !== toISODate(sale.soldAt)) sale.soldAt = saleDate(req.body.soldAt);
    await sale.save();
  } catch (err) {
    if (productExists && extraUnits !== 0) await returnToStock(sale.product, extraUnits);
    throw err;
  }

  res.json(await Sale.findById(sale._id).populate('product', PRODUCT_FIELDS));
}

// Undoes a sale entered by mistake: removes it and returns the units to stock
// (unless the product itself was deleted since).
export async function remove(req, res) {
  const sale = await Sale.findByIdAndDelete(req.params.id);
  if (!sale) throw new HttpError(404, 'Venta no encontrada');
  await returnToStock(sale.product, sale.quantity);
  res.json({ message: 'Venta anulada' });
}
